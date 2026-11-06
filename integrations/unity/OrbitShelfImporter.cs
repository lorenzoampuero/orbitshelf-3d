// OrbitShelf importer for the Unity editor. Put this file in an "Editor" folder of your project.
// It only READS your models (token with the assets:read permission) and saves the GLB into Assets/OrbitShelf/.
// Unity cannot open GLB by itself: install glTFast (com.unity.cloud.gltfast) from Package Manager, then Unity imports the .glb files.
// NEVER RUN inside Unity yet: it was written against the documented editor API and has not been tried in a real project.
#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;

public class OrbitShelfImporter : EditorWindow
{
    const string UrlKey = "OrbitShelf.SiteUrl";
    const long MaxBytes = 100L * 1024 * 1024;

    [Serializable] class Asset { public string id; public string title; public string status; public string provenance; public string reviewState; }
    [Serializable] class AssetList { public Asset[] assets; }

    string siteUrl, token = "", message = "";
    readonly List<Asset> assets = new List<Asset>();
    Vector2 scroll;

    [MenuItem("Window/OrbitShelf")]
    static void Open() => GetWindow<OrbitShelfImporter>("OrbitShelf");

    void OnEnable() => siteUrl = EditorPrefs.GetString(UrlKey, "https://");

    // The token is never saved to disk: type it each session.
    void OnGUI()
    {
        siteUrl = EditorGUILayout.TextField("Site address", siteUrl);
        token = EditorGUILayout.PasswordField("Token (assets:read)", token);
        if (GUILayout.Button("Load my models")) Load();
        EditorGUILayout.HelpBox(message, MessageType.None);
        scroll = EditorGUILayout.BeginScrollView(scroll);
        foreach (var a in assets)
        {
            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField(a.title, GUILayout.MinWidth(120));
            EditorGUILayout.LabelField(a.reviewState ?? "", GUILayout.Width(90));
            if (GUILayout.Button("Download", GUILayout.Width(80))) Download(a);
            EditorGUILayout.EndHorizontal();
        }
        EditorGUILayout.EndScrollView();
    }

    UnityWebRequest Get(string path)
    {
        var url = siteUrl.TrimEnd('/') + "/api/v1" + path;
        if (!(url.StartsWith("https://") || url.StartsWith("http://localhost") || url.StartsWith("http://127.0.0.1")))
            throw new InvalidOperationException("Use an https address so the token is not sent in the clear.");
        var req = UnityWebRequest.Get(url);
        req.SetRequestHeader("Authorization", "Bearer " + token);
        return req;
    }

    void Load()
    {
        try
        {
            EditorPrefs.SetString(UrlKey, siteUrl);
            var op = Get("/assets").SendWebRequest();
            op.completed += _ =>
            {
                var req = op.webRequest;
                if (req.result != UnityWebRequest.Result.Success) { message = "Error: " + req.error; Repaint(); return; }
                var list = JsonUtility.FromJson<AssetList>(req.downloadHandler.text);
                assets.Clear();
                foreach (var a in list.assets) if (a.status == "ready") assets.Add(a);
                message = assets.Count + " models.";
                Repaint();
            };
        }
        catch (Exception e) { message = e.Message; }
    }

    void Download(Asset a)
    {
        try
        {
            var op = Get("/assets/" + UnityWebRequest.EscapeURL(a.id) + "/file").SendWebRequest();
            op.completed += _ =>
            {
                var req = op.webRequest;
                if (req.result != UnityWebRequest.Result.Success) { message = "Error: " + req.error; Repaint(); return; }
                var data = req.downloadHandler.data;
                if (data.LongLength > MaxBytes || data.Length < 4 || data[0] != 'g' || data[1] != 'l' || data[2] != 'T' || data[3] != 'F')
                { message = "The server did not return a valid GLB."; Repaint(); return; }
                Directory.CreateDirectory("Assets/OrbitShelf");
                var safe = string.Concat((a.title ?? "model").Split(Path.GetInvalidFileNameChars()));
                var path = "Assets/OrbitShelf/" + safe + "-" + a.id.Substring(0, Math.Min(6, a.id.Length)) + ".glb";
                File.WriteAllBytes(path, data);
                // A generated model can differ from the real product, so its origin and review state are kept next to it.
                File.WriteAllText(path + ".orbitshelf.txt", "asset=" + a.id + "\nprovenance=" + a.provenance + "\nreview=" + a.reviewState + "\n");
                AssetDatabase.Refresh();
                message = "Saved " + path;
                Repaint();
            };
        }
        catch (Exception e) { message = e.Message; }
    }
}
#endif
