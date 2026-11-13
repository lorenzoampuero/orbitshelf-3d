"""Studio renders for the public site. Runs inside Blender, never in the app.

    blender -b --factory-startup -P scripts/render-landing.py -- --id dragon --what stills

Reads the source models from .art-cache/ (not in git) and writes PNGs to .art-cache/out/<id>/.
scripts/build-landing-art.ts turns those into the WebP and video files the site serves.
"""
import argparse
import json
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CACHE = os.path.join(ROOT, ".art-cache")
DEMO = os.path.join(ROOT, "public", "demo")

# yaw: degrees the model turns for the main shot. alt: same for the second shot.
# key and rim scale the lights. A black garment needs far more light than an orange dragon to read on a dark page.
MODELS = {
    "dragon": {"src": os.path.join(CACHE, "dragon", "base_basic_pbr.glb"), "yaw": -24, "alt": 28, "elev": 7, "key": 1.0, "rim": 1.0},
    "hoodie": {"src": os.path.join(CACHE, "hoodie", "base.obj"), "tex": os.path.join(CACHE, "hoodie"), "yaw": -22, "alt": 150, "elev": 6, "key": 2.6, "rim": 2.4},
    "kitchen": {"src": os.path.join(CACHE, "kitchen", "base.obj"), "tex": os.path.join(CACHE, "kitchen"), "yaw": -30, "alt": 26, "elev": 10, "key": 1.2, "rim": 0.15},
    "bust": {"src": os.path.join(DEMO, "marble_bust_01.glb"), "yaw": -28, "alt": 30, "elev": 5, "key": 1.0, "rim": 1.2},
    "camera": {"src": os.path.join(DEMO, "camera_01.glb"), "yaw": -32, "alt": 30, "elev": 12, "key": 1.1, "rim": 1.2},
    "lounge": {"src": os.path.join(DEMO, "mid_century_lounge_chair.glb"), "yaw": -36, "alt": 34, "elev": 10, "key": 1.1, "rim": 1.0},
    "lantern": {"src": os.path.join(DEMO, "lantern_01.glb"), "yaw": -24, "alt": 30, "elev": 6, "key": 1.1, "rim": 1.2},
}

# Catalogue of the delivered models, filled in after the contact sheet (docs/PLAN_REDISENO.md, phase 0).
# Each entry: {"src": path relative to .art-cache, "tex": optional folder, "yaw", "alt", "elev", "key", "rim", ...}.
# Entries whose id is already in MODELS are ignored.
CATALOGUE = os.path.join(CACHE, "models.json")
if os.path.exists(CATALOGUE):
    with open(CATALOGUE, encoding="utf-8") as fh:
        for _id, _cfg in json.load(fh).items():
            if _id in MODELS or "src" not in _cfg:
                continue
            _cfg = dict(_cfg)
            _cfg["src"] = os.path.join(CACHE, _cfg["src"])
            if _cfg.get("tex"):
                _cfg["tex"] = os.path.join(CACHE, _cfg["tex"])
            for _k, _v in {"yaw": -24, "alt": 28, "elev": 7, "key": 1.0, "rim": 1.0}.items():
                _cfg.setdefault(_k, _v)
            MODELS[_id] = _cfg

VIOLET = (0.30, 0.17, 1.0)
WARM = (1.0, 0.95, 0.90)
TURN_FRAMES = 96
WIRE_FACES = 14000
WEB_FACES = 50000
CARD_FACES = 12000
SPIN_FRAMES = 36
SPIN_RES = 512
SPIN_SAMPLES = 40


def args():
    p = argparse.ArgumentParser()
    p.add_argument("--id", required=True, choices=sorted(MODELS))
    p.add_argument("--what", default="stills", choices=["preview", "stills", "wire", "turn", "web", "contact", "art", "glb"])
    p.add_argument("--res", type=int, default=0)
    p.add_argument("--samples", type=int, default=0)
    return p.parse_args(sys.argv[sys.argv.index("--") + 1:])


def use_gpu(scene):
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        found = [d for d in prefs.devices if d.type == kind]
        if found:
            for d in prefs.devices:
                d.use = d.type == kind
            scene.cycles.device = "GPU"
            print(f"render device: {kind} {[d.name for d in found]}")
            return kind
    print("render device: CPU")
    return "CPU"


def texture_node(nodes, path, colorspace):
    n = nodes.new("ShaderNodeTexImage")
    n.image = bpy.data.images.load(path)
    n.image.colorspace_settings.name = colorspace
    return n


def obj_material(folder):
    """The OBJ downloads come without an .mtl: the maps sit next to the mesh."""
    mat = bpy.data.materials.new("model")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    links.new(texture_node(nodes, os.path.join(folder, "texture_diffuse.png"), "sRGB").outputs["Color"], bsdf.inputs["Base Color"])
    links.new(texture_node(nodes, os.path.join(folder, "texture_metallic.png"), "Non-Color").outputs["Color"], bsdf.inputs["Metallic"])
    links.new(texture_node(nodes, os.path.join(folder, "texture_roughness.png"), "Non-Color").outputs["Color"], bsdf.inputs["Roughness"])
    normal = nodes.new("ShaderNodeNormalMap")
    links.new(texture_node(nodes, os.path.join(folder, "texture_normal.png"), "Non-Color").outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def import_model(cfg):
    before = set(bpy.data.objects)
    if cfg["src"].endswith(".obj"):
        bpy.ops.wm.obj_import(filepath=cfg["src"], forward_axis="NEGATIVE_Z", up_axis="Y")
    else:
        bpy.ops.import_scene.gltf(filepath=cfg["src"])
    meshes = [o for o in set(bpy.data.objects) - before if o.type == "MESH"]
    if cfg.get("tex"):
        mat = obj_material(cfg["tex"])
        for o in meshes:
            o.data.materials.clear()
            o.data.materials.append(mat)
    return meshes


def bounds(meshes):
    bpy.context.view_layer.update()
    corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    return Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners))), Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))


def normalise(meshes):
    """Every model ends up two units at its largest, centred, standing on the floor, under one pivot."""
    low, high = bounds(meshes)
    scale = 2.0 / max(high - low)
    pivot = bpy.data.objects.new("pivot", None)
    bpy.context.scene.collection.objects.link(pivot)
    centre = (low + high) / 2
    for o in meshes:
        o.matrix_world.translation -= Vector((centre.x, centre.y, low.z))
    bpy.context.view_layer.update()
    for o in meshes:
        o.parent = pivot
    pivot.scale = (scale, scale, scale)
    bpy.context.view_layer.update()
    return pivot


def area_light(name, location, target, size, power, color):
    data = bpy.data.lights.new(name, "AREA")
    data.size, data.energy, data.color = size, power, color
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - Vector(location)).to_track_quat("-Z", "Y").to_euler()


def studio(cfg, height):
    mid = (0, 0, height * 0.5)
    area_light("key", (-2.8, -3.6, 3.4), mid, 3.2, 340 * cfg["key"], WARM)
    area_light("fill", (3.6, -2.8, 1.2), mid, 4.0, 70 * cfg["key"], (0.82, 0.86, 1.0))
    area_light("rim_left", (-3.4, 3.0, 2.2), mid, 2.2, 1000 * cfg["rim"], VIOLET)
    area_light("rim_right", (3.4, 3.0, 2.4), mid, 2.2, 1200 * cfg["rim"], VIOLET)
    area_light("top", (0, 0.6, 4.6), mid, 3.0, 110 * cfg["key"], WARM)

    world = bpy.data.worlds.new("world")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.055, 0.05, 0.085, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.is_shadow_catcher = True
    return floor


def camera(cfg, low, high):
    data = bpy.data.cameras.new("cam")
    data.lens, data.sensor_width = 85, 36
    cam = bpy.data.objects.new("cam", data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    centre = (low + high) / 2
    radius = (high - low).length / 2
    distance = radius / math.sin(data.angle / 2) * 1.02
    elev = math.radians(cfg["elev"])
    cam.location = centre + Vector((0, -math.cos(elev) * distance, math.sin(elev) * distance))
    cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()


def clay_material(color=(0.56, 0.54, 0.60, 1)):
    mat = bpy.data.materials.new("clay")
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.58
    return mat


def wire_material():
    mat = bpy.data.materials.new("wire")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.remove(next(n for n in nodes if n.type == "BSDF_PRINCIPLED"))
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (0.42, 0.26, 1.0, 1)
    emit.inputs["Strength"].default_value = 2.4
    mat.node_tree.links.new(emit.outputs["Emission"], next(n for n in nodes if n.type == "OUTPUT_MATERIAL").inputs["Surface"])
    return mat


def reduce_mesh(body, target):
    # UV seams split the vertices; welding them first keeps the simplified mesh closed. UVs live per corner, so they survive.
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(body.data)
    bm.free()
    faces = len(body.data.polygons)
    bpy.context.view_layer.objects.active = body
    decimate = body.modifiers.new("decimate", "DECIMATE")
    decimate.ratio = min(1.0, target / max(faces, 1))
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    print(f"reduced: {faces} faces -> {len(body.data.polygons)}")


def join_all(meshes):
    """One object with several material slots: weld and decimate work on a single mesh."""
    if len(meshes) == 1:
        return meshes[0]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    return bpy.context.active_object


def export_glb(path, body=None, smooth=False):
    """Writes the GLB. `smooth` shades the body smooth first: flat-shaded geometry exports three vertices per triangle,
    which is what made the untextured sculpt weigh 12 MB at 150k triangles."""
    if smooth and body is not None:
        bpy.ops.object.select_all(action="DESELECT")
        body.select_set(True)
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.shade_smooth()
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_cameras=False, export_lights=False)
    print(f"wrote {path} {os.path.getsize(path)} bytes")


def wire_copy(meshes, pivot, clay):
    """A low-poly copy with violet edges. The real mesh has two million triangles, so its edges would be solid colour."""
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.duplicate(linked=False)
    copies = list(bpy.context.selected_objects)
    bpy.context.view_layer.objects.active = copies[0]
    if len(copies) > 1:
        bpy.ops.object.join()
    body = bpy.context.active_object

    reduce_mesh(body, WIRE_FACES)
    body.data.materials.clear()
    body.data.materials.append(clay)

    edges = body.copy()
    edges.data = body.data.copy()
    bpy.context.scene.collection.objects.link(edges)
    edges.parent = pivot
    edges.matrix_parent_inverse = body.matrix_parent_inverse
    wire = edges.modifiers.new("wire", "WIREFRAME")
    wire.thickness, wire.use_relative_offset, wire.offset = 0.0018 / pivot.scale[0], False, 0.0
    wire.use_even_offset = False  # even offset shoots spikes out of thin, sharp corners
    edges.data.materials.clear()
    edges.data.materials.append(wire_material())
    return [body, edges]


def show(objs, visible):
    for o in objs:
        o.hide_render = not visible


def shoot(scene, pivot, yaw, path):
    pivot.rotation_euler.z = math.radians(yaw)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"wrote {path}")


def main():
    a = args()
    cfg = MODELS[a.id]
    out = os.path.join(CACHE, "out", a.id)
    os.makedirs(out, exist_ok=True)

    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    device = use_gpu(scene)
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPTIX" if device == "OPTIX" else "OPENIMAGEDENOISE"
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.max_bounces = 6
    scene.render.film_transparent = True
    scene.render.use_persistent_data = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Punchy"
    except TypeError:
        pass

    defaults = {"preview": (900, 48), "stills": (2000, 192), "wire": (2000, 96), "turn": (900, 64), "web": (0, 0), "contact": (512, 32), "art": (1600, 160), "glb": (0, 0)}[a.what]
    res = a.res or defaults[0]
    scene.render.resolution_x = scene.render.resolution_y = res
    scene.cycles.samples = a.samples or defaults[1]

    meshes = import_model(cfg)
    if a.what == "contact":
        # One small shot plus the numbers the contact sheet prints under it.
        tris = 0
        for o in meshes:
            o.data.calc_loop_triangles()
            tris += len(o.data.loop_triangles)
        low, high = bounds(meshes)
        size = high - low
        info = {
            "id": a.id,
            "tris": tris,
            "parts": len(meshes),
            "materials": len({m.name for o in meshes for m in o.data.materials if m}),
            "size": [round(size.x, 3), round(size.y, 3), round(size.z, 3)],
            "textures": [[i.name, i.size[0], i.size[1]] for i in bpy.data.images if i.size[0] > 0 and i.name != "Render Result"],
        }
        with open(os.path.join(out, "info.json"), "w", encoding="utf-8") as fh:
            json.dump(info, fh)
        pivot = normalise(meshes)
        low, high = bounds(meshes)
        studio(cfg, high.z - low.z)
        camera(cfg, low, high)
        shoot(scene, pivot, cfg["yaw"], os.path.join(out, "contact.png"))
        return

    if a.what == "art":
        # Everything the model gallery needs from one import: the main shot, a 36-frame spin, and the web and card levels.
        pivot = normalise(meshes)
        low, high = bounds(meshes)
        floor = studio(cfg, high.z - low.z)
        camera(cfg, low, high)
        shoot(scene, pivot, cfg["yaw"], os.path.join(out, "beauty.png"))
        scene.render.resolution_x = scene.render.resolution_y = SPIN_RES
        scene.cycles.samples = SPIN_SAMPLES
        folder = os.path.join(out, "spin")
        os.makedirs(folder, exist_ok=True)
        for f in range(SPIN_FRAMES):
            shoot(scene, pivot, cfg["yaw"] + 360 * f / SPIN_FRAMES, os.path.join(folder, f"{f:04d}.png"))
        bpy.data.objects.remove(floor)
        pivot.rotation_euler.z = 0
        body = join_all(meshes)
        reduce_mesh(body, cfg.get("web_faces", WEB_FACES))
        export_glb(os.path.join(out, "web.glb"), body, cfg.get("smooth"))
        reduce_mesh(body, cfg.get("card_faces", CARD_FACES))
        export_glb(os.path.join(out, "card.glb"), body, cfg.get("smooth"))
        return

    if a.what == "glb":
        # Only the two GLB levels, without rendering. Quick way to retune the triangle budgets.
        pivot = normalise(meshes)
        body = join_all(meshes)
        reduce_mesh(body, cfg.get("web_faces", WEB_FACES))
        export_glb(os.path.join(out, "web.glb"), body, cfg.get("smooth"))
        reduce_mesh(body, cfg.get("card_faces", CARD_FACES))
        export_glb(os.path.join(out, "card.glb"), body, cfg.get("smooth"))
        return

    if a.what == "web":
        # The live hero model. Hyper3D's UV atlas is so fragmented that seam-locked simplifiers stop near 120k triangles.
        reduce_mesh(meshes[0], WEB_FACES)
        bpy.ops.export_scene.gltf(filepath=os.path.join(out, "web.glb"), export_format="GLB", export_cameras=False, export_lights=False)
        print(f"wrote {os.path.join(out, 'web.glb')}")
        return

    pivot = normalise(meshes)
    low, high = bounds(meshes)
    studio(cfg, high.z - low.z)
    camera(cfg, low, high)

    if a.what == "turn":
        folder = os.path.join(out, "turn")
        os.makedirs(folder, exist_ok=True)
        for f in range(TURN_FRAMES):
            shoot(scene, pivot, cfg["yaw"] + 360 * f / TURN_FRAMES, os.path.join(folder, f"{f:04d}.png"))
        return

    if a.what != "wire":
        shoot(scene, pivot, cfg["yaw"], os.path.join(out, "beauty.png"))
        if a.what == "preview":
            return
        shoot(scene, pivot, cfg["alt"], os.path.join(out, "alt.png"))
        scene.view_layers[0].material_override = clay_material()
        shoot(scene, pivot, cfg["yaw"], os.path.join(out, "clay.png"))
        scene.view_layers[0].material_override = None

    # Dark body, so the violet edges are what you read. The copies inherit hide_render, so the originals are hidden last.
    pivot.rotation_euler.z = 0
    bpy.context.view_layer.update()
    wire_copy(meshes, pivot, clay_material((0.07, 0.065, 0.10, 1)))
    show(meshes, False)
    shoot(scene, pivot, cfg["yaw"], os.path.join(out, "wire.png"))


main()
