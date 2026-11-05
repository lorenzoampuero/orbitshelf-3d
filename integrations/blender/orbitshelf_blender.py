"""OrbitShelf 3D add-on for Blender: list your models and import one into the scene.

NOT TESTED INSIDE BLENDER YET. See integrations/README.md.

It only needs a token with the assets:read permission, created under API in the dashboard. Use a token for this
purpose alone: it is kept in Blender's preferences, and you can revoke it at any time. It cannot spend balance or delete anything.
"""

import json
import os
import tempfile
import threading
import urllib.error
import urllib.parse
import urllib.request

import bpy

bl_info = {
    "name": "OrbitShelf 3D",
    "author": "OrbitShelf",
    "version": (0, 1, 0),
    "blender": (4, 2, 0),
    "location": "View3D > Sidebar > OrbitShelf",
    "description": "Import your OrbitShelf 3D models",
    "category": "Import-Export",
}

MAX_DOWNLOAD_BYTES = 60 * 1024 * 1024

# Requests run on a thread so the interface never freezes. Blender data can only be touched from the main
# thread, so the worker leaves its result here and a timer on the main thread picks it up.
_state = {"assets": [], "busy": False, "message": "", "pending_import": None}


def _prefs():
    return bpy.context.preferences.addons[__name__].preferences


def _request(base, token, path):
    url = base.rstrip("/") + "/api/v1" + path
    if not url.startswith(("https://", "http://localhost", "http://127.0.0.1")):
        raise ValueError("Use an https address, so the token is not sent in the clear.")
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
    return urllib.request.urlopen(req, timeout=120)


def _api_error(err):
    if isinstance(err, urllib.error.HTTPError):
        try:
            return json.loads(err.read().decode("utf-8"))["error"]["message"]
        except Exception:
            return "The server returned HTTP %d." % err.code
    return str(err)


def _load_assets(base, token):
    try:
        with _request(base, token, "/assets") as res:
            assets = json.loads(res.read().decode("utf-8"))["assets"]
        _state["assets"] = [a for a in assets if a.get("status") == "ready"]
        _state["message"] = "%d models." % len(_state["assets"])
    except Exception as err:
        _state["message"] = _api_error(err)
    finally:
        _state["busy"] = False


def _download(base, token, asset):
    try:
        path = "/assets/%s/file" % urllib.parse.quote(asset["id"])
        with _request(base, token, path) as res:
            data = res.read(MAX_DOWNLOAD_BYTES + 1)
        if len(data) > MAX_DOWNLOAD_BYTES:
            raise ValueError("The file is larger than the allowed maximum.")
        if data[:4] != b"glTF":
            raise ValueError("The server did not return a GLB file.")
        handle, target = tempfile.mkstemp(suffix=".glb", prefix="orbitshelf_")
        with os.fdopen(handle, "wb") as out:
            out.write(data)
        _state["pending_import"] = (target, asset)
    except Exception as err:
        _state["message"] = _api_error(err)
        _state["busy"] = False


def _main_thread_timer():
    pending = _state["pending_import"]
    if pending:
        _state["pending_import"] = None
        target, asset = pending
        try:
            bpy.ops.import_scene.gltf(filepath=target)
            # A generated model can differ from the real product, so the origin travels with the object.
            for obj in bpy.context.selected_objects:
                obj["orbitshelf_asset_id"] = asset["id"]
                obj["orbitshelf_provenance"] = asset.get("provenance", "")
                obj["orbitshelf_review_state"] = asset.get("reviewState", "")
            _state["message"] = "Imported: %s" % asset.get("title", "")
        except Exception as err:
            _state["message"] = str(err)
        finally:
            _state["busy"] = False
            try:
                os.remove(target)
            except OSError:
                pass
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()
    return 0.5


class OrbitShelfPreferences(bpy.types.AddonPreferences):
    bl_idname = __name__
    site_url: bpy.props.StringProperty(name="Site address", default="")
    token: bpy.props.StringProperty(name="Token (assets:read)", subtype="PASSWORD", default="")

    def draw(self, context):
        self.layout.prop(self, "site_url")
        self.layout.prop(self, "token")


class ORBITSHELF_OT_refresh(bpy.types.Operator):
    bl_idname = "orbitshelf.refresh"
    bl_label = "Refresh"

    def execute(self, context):
        prefs = _prefs()
        if not prefs.site_url or not prefs.token:
            self.report({"ERROR"}, "Set the site address and token in the add-on preferences.")
            return {"CANCELLED"}
        if _state["busy"]:
            return {"CANCELLED"}
        _state["busy"] = True
        _state["message"] = "Loading..."
        threading.Thread(target=_load_assets, args=(prefs.site_url, prefs.token), daemon=True).start()
        return {"FINISHED"}


class ORBITSHELF_OT_import(bpy.types.Operator):
    bl_idname = "orbitshelf.import_asset"
    bl_label = "Import"
    asset_id: bpy.props.StringProperty()

    def execute(self, context):
        asset = next((a for a in _state["assets"] if a["id"] == self.asset_id), None)
        if not asset or _state["busy"]:
            return {"CANCELLED"}
        prefs = _prefs()
        _state["busy"] = True
        _state["message"] = "Downloading..."
        threading.Thread(target=_download, args=(prefs.site_url, prefs.token, asset), daemon=True).start()
        return {"FINISHED"}


class ORBITSHELF_PT_panel(bpy.types.Panel):
    bl_label = "OrbitShelf 3D"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "OrbitShelf"

    def draw(self, context):
        layout = self.layout
        layout.operator("orbitshelf.refresh", icon="FILE_REFRESH")
        if _state["message"]:
            layout.label(text=_state["message"])
        for asset in _state["assets"]:
            row = layout.row()
            row.label(text=asset.get("title", ""))
            row.enabled = not _state["busy"]
            row.operator("orbitshelf.import_asset", text="Import").asset_id = asset["id"]


_classes = (OrbitShelfPreferences, ORBITSHELF_OT_refresh, ORBITSHELF_OT_import, ORBITSHELF_PT_panel)


def register():
    for cls in _classes:
        bpy.utils.register_class(cls)
    bpy.app.timers.register(_main_thread_timer, persistent=True)


def unregister():
    if bpy.app.timers.is_registered(_main_thread_timer):
        bpy.app.timers.unregister(_main_thread_timer)
    for cls in reversed(_classes):
        bpy.utils.unregister_class(cls)
