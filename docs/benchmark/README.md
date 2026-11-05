# Comparar motores con dinero real (Fase 10)

Este kit está probado solo con proveedores simulados. **Nadie lo ha corrido con dinero.** Sirve para responder lo que falta saber: qué tan bien sale cada motor con tus productos, sobre todo la ropa, y cuánto cuesta de verdad cada modelo utilizable.

## Antes de gastar

1. Decide el presupuesto.
2. Pide a fal la confirmación escrita sobre reventa (ver `docs/AUDITORIA_ESTADO_ACTUAL.md`).
3. Usa fotos propias o con permiso. No uses fotos confidenciales de una tienda.
4. Pon las claves solo en `.env`: `FAL_KEY`, `MESHY_API_KEY`, `SLOYD_CLIENT_ID`, `SLOYD_CLIENT_SECRET`. Meshy necesita un plan con API.

## Paso 1: el manifiesto

Copia `MANIFIESTO_PLANTILLA.csv` a una carpeta con tus fotos y agrega una fila por producto. Las rutas son relativas al manifiesto. `derechos_confirmados` debe decir `si`, o esa fila no se envía a ningún proveedor.

| Ronda | Productos | Composición sugerida |
|---|---|---|
| 1 | 8 | 3 prendas, 2 objetos rígidos con logo, 1 mueble, 1 objeto para juegos, 1 caso difícil |
| 2 | 30 | 8 prendas, 10 objetos de tienda, 6 para juegos, 3 estilizados, 3 casos difíciles |

El informe original proponía 12 + 8 + 5 + 5 y no incluía ropa. La ropa es tu caso principal, por eso aparece aquí.

## Paso 2: ver el costo, sin gastar

```bash
npm run benchmark -- plan --manifest ruta/manifiesto.csv
```

Elige motores con `--engines fal-trellis-1,fal-rodin-2.5-fast`. Los identificadores están en `src/lib/provider/registry.ts`.

## Paso 3: correrlo

```bash
npm run benchmark -- run --manifest ruta/manifiesto.csv --engines fal-trellis-1,fal-rodin-2.5-fast --budget 17 --confirm-spend
```

- Sin `--budget` y `--confirm-spend` no gasta nada.
- Se detiene antes de pasar del presupuesto. Lo que no alcanzó queda como `not_run`.
- Si no hay respuesta del proveedor, cuenta el trabajo como cobrado, porque puede haberlo cobrado.
- El presupuesto usa precios publicados. Revisa la factura: Sloyd pide una compra mínima de US$12 y Meshy vende planes mensuales, y eso no entra en este cálculo.

Los resultados quedan en `.benchmark/<fecha>/`, que no se sube a git.

## Paso 4: revisar a ciegas

Abre los modelos de `revision-ciega/` y llena `revision-ciega.csv`:

| Columna | Qué poner |
|---|---|
| `forma_1a5`, `textura_1a5` | Nota de 1 a 5 comparando con la foto |
| `defectos` | Lo que viste, en texto libre |
| `utilizable_si_no` | `si` si lo publicarías sin arreglos importantes |

No abras `clave-no-abrir-antes-de-revisar.csv` hasta terminar. Si puedes, pide a otra persona que también revise.

## Paso 5: el puntaje

```bash
npm run benchmark -- score --dir .benchmark/<fecha>
```

Genera `puntaje.csv`, ordenado por costo por modelo utilizable. Ese costo cuenta todo lo que se pagó, incluidos los fallidos y los no utilizables. Lo no revisado no cuenta como utilizable.

## Después

Con esos datos se decide qué motores activar (`ENGINES_ENABLED`), se repite `scripts/simulate-plans.ts` con costos reales y se fijan los precios.

Una vez en uso, `npm run report:engines` muestra por motor los trabajos, fallos, aprobaciones y costo por modelo aprobado. Lo que el informe pedía como panel de administración quedó como este comando, porque la app no tiene roles de administrador y los clientes no deben ver los costos del proveedor.

## Lo que se sabe que falta comprobar

- **Hunyuan:** fal describe `model_glb` como "GLB si está disponible, si no OBJ", y su ejemplo es un OBJ. Si llega un OBJ, el trabajo falla sin guardar nada.
- **TRELLIS (primera versión):** el ejemplo de fal muestra un PNG en el campo del modelo. Si no llega un GLB, también falla.
- **Tamaño de las fotos:** van incluidas en la solicitud. Hunyuan recomienda 6 MB como máximo en ese formato, y OrbitShelf acepta hasta 8 MB, así que una foto grande podría ser rechazada.
- **Meshy:** los US$0,02 por crédito convierten el plan Pro (19.000 CLP por 1.000 créditos) a unos 950 CLP por dólar. Es una estimación.
