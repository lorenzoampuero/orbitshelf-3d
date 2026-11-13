# Clasificación de los modelos entregados

Propuesta del 2026-11-12 a partir de `hoja-de-contactos.png`. **El dueño tiene la última palabra.** `use` = se usa, `review` = pendiente de decisión, `exclude` = fuera.

Texturas medidas: todas de 2048 px salvo `dfdd3521` (4096), `agentic` (1024) y `sculpt` (sin textura).

| Id | Nombre | Categoría | Triángulos | Textura (px) | Estado | Motivo |
|---|---|---|---:|---:|---|---|
| `0237e0b0` | Blue puffer jacket | apparel | 500 k | 2048 | use |  |
| `224688df` | Robot dog | product | 500 k | 2048 | use |  |
| `322f0e31` | Purple dragon | creature | 10 k | 2048 | use |  |
| `380eaea7` | Orange puffer vest | apparel | 500 k | 2048 | use |  |
| `4fbe56d9` | Gothic chapel | architecture | 1000 k | 2048 | use |  |
| `6028defa` | Stone cottage | architecture | 10 k | 2048 | use |  |
| `6200c066` | Lizard creature | creature | 500 k | 2048 | use |  |
| `7088689d` | Fantasy tower | architecture | 500 k | 2048 | use |  |
| `7850adb8` | Fabric loveseat | furniture | 120 k | 2048 | use |  |
| `824e0e1c` | Orange walker mech | character | 1000 k | 2048 | use |  |
| `842cbef6` | Grey sofa | furniture | 21 k | 2048 | use |  |
| `9a58e407` | Crystal golem | character | 500 k | 2048 | use |  |
| `9b749bdb` | T-rex | creature | 2.00 M | 2048 | use |  |
| `9ba1b1f1` | Monster head | creature | 19 k | 2048 | use |  |
| `9d8b403c` | Money bag | prop | 2.00 M | 2048 | use |  |
| `bfda4d75` | Tufted sofa | furniture | 20 k | 2048 | use |  |
| `c24ab0e5` | Zip hoodie | apparel | 2.00 M | 2048 | use |  |
| `dfdd3521` | Red dragon | creature | 2.00 M | 4096 | use | Only 4096 px texture |
| `f8ae7234` | Baby dragon | creature | 2.00 M | 2048 | use | Already on the home |
| `fcebda7b` | White loveseat | furniture | 38 k | 2048 | use |  |
| `hoodie` | Black hoodie | apparel | 2.00 M | 2048 | use | Already on the home |
| `kitchen` | Kitchen units | furniture | 1.60 M | 2048 | use | Already on the home |
| `26375c79` | White battle mech | character | 349 k | 2048 | review | Missile pods; similar to existing mech designs |
| `3155ce62` | Sci-fi blaster | prop | 19 k | 2048 | review | A weapon-shaped prop, even if toy-like |
| `41676bd2` | Orange assault mech | character | 2.00 M | 2048 | review | Reads as an existing anime mech and carries a rifle; same proportions as the excluded warrior |
| `64c5bdd7` | Dark frame block | prop | 2.00 M | 2048 | review | Unclear subject, low appeal on its own |
| `a60f2e3c` | Wooden toy figure | character | 500 k | 2048 | review | Close to a known tree-character figure; check |
| `agentic` | Sci-fi device (230 parts) | prop | 63 k | 1024 | review | Part names mention accessory rails: may be a firearm |
| `ddd737fb` | Blocky voxel character | character | 500 k | 2048 | review | Reads as the Minecraft player |
| `sculpt` | Geometry-only gadget | prop | 4.79 M | 256 | review | 4.79M triangles, no textures |
| `d3e53c56` | Green shopping bag with logo | product | 2.00 M | 2048 | exclude | Carries the Shopify logo: third-party brand |
| `d99155df` | Warrior with sword | character | 2.00 M | 2048 | exclude | Looks like a third-party video game character |
| `fb365098` | Blender logo | product | 35 k | 2048 | exclude | Third-party logo |

## Decisión del dueño (2026-11-12)

- Se usan todos los modelos, salvo el guerrero `d99155df` (decisión anterior, sigue excluido).
- `d3e53c56` (Shopify), `64c5bdd7` (probable logo de Unity) y `fb365098` (Blender) van **solo en la sección de conexiones**: ilustran destinos que leen los archivos y sirven para hablar después de conectar con Roblox Studio, imprimir directo y otras conexiones futuras.
- Todo lo que aún no existe (Roblox Studio, impresión directa, conexiones directas con Unity y Blender) se muestra como "próximamente", nunca como función disponible.
