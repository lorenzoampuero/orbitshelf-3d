# Modelos para los renders de la web

1. Copia aquí tus GLB (por ejemplo `poleron.glb`, `dragon.glb`, `personaje.glb`, `mueble.glb`, `casa.glb`).
2. Crea `manifest.json` junto a ellos, para dejar constancia de su origen y derechos:

```json
[
  { "file": "dragon.glb", "name": "Dragón", "niche": "games", "origin": "propio", "rights": "uso comercial confirmado" }
]
```

3. Ejecuta `npm run render-kit`. Salen `public/showcase/<nombre>.png` (materiales originales) y `<nombre>-clay.png` (gris liso), ambos con fondo transparente, más `showcase.json`.

No presentes estos renders como "generados con OrbitShelf" salvo que lo sean. Los que no tengan origen y derechos declarados no deben publicarse.
