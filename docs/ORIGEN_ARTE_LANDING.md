# Origen del arte de la web pública

Registro de cada modelo usado en `public/landing/`. Sirve para saber de dónde salió cada imagen si alguien lo pregunta.

| Modelo | Origen | Licencia o permiso | Dónde se usa |
|---|---|---|---|
| Dragón (`dragon`) | Descargado de Hyper3D Rodin por el dueño, 2026-11-09 | Plan de pago de Hyper3D, según el dueño | Home |
| Hoodie (`hoodie`) | Descargado de Hyper3D Rodin por el dueño, 2026-11-09 | Plan de pago de Hyper3D, según el dueño | Home |
| Muebles de cocina (`kitchen`) | Descargado de Hyper3D Rodin por el dueño, 2026-11-09 | Plan de pago de Hyper3D, según el dueño | Home |
| Busto, cámara, sillón, farol | Poly Haven (ya en `public/demo`) | CC0 | Home |

## Reglas

- **El plan de pago no está verificado por escrito.** Lo indicó el dueño el 2026-11-09. Los términos de Hyper3D (§2) hacen depender la exportación comercial del plan; conviene guardar el comprobante.
- Los términos de Hyper3D (§5) hacen responsable al usuario de que el contenido no infrinja derechos de terceros, y (§6.3) prohíben usar el servicio para entrenar o desarrollar modelos o servicios competidores. Usar estas imágenes como ilustración no entrena nada. Conviene consultar a un abogado antes del lanzamiento, porque OrbitShelf compite en parte con Hyper3D.
- **Excluido:** el guerrero con espada, por su parecido con un personaje de videojuego de un tercero.
- Estos modelos **no se hicieron en OrbitShelf**, así que no van en `src/config/showcase.ts`.
- **Sin nota de origen en la web**, por decisión del dueño del 2026-11-09. Este documento queda como registro interno. La web no debe afirmar que estos modelos se generaron con OrbitShelf.
- No se usa ninguna imagen, texto ni marca de Hyper3D.

## Cómo se generan

1. Copiar los modelos a `.art-cache/` (no se sube a git).
2. `blender -b --factory-startup -P scripts/render-landing.py -- --id dragon --what stills` y lo mismo con `--what turn`. Blender 5.2, Cycles con OptiX.
3. `npm run landing-art` genera los WebP, videos y GLB web en `public/landing/`.
