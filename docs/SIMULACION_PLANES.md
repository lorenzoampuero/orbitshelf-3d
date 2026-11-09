# Simulación de planes

**Esto no es una oferta ni una decisión de precios.** Ningún motor se ha probado con dinero: los costos son precios publicados más supuestos sin medir. Sirve para comparar estructuras y detectar las que no funcionan. Hay que repetirla con facturas reales (Fase 10).

Generado con `scripts/simulate-plans.ts`. El detalle está en `PLANES_MARGEN_SIMULADO.csv`.

## Supuestos sin medir

- Reintentos facturados: 20 % del precio del proveedor.
- Conversión, almacenamiento y entrega: US$0.07 por trabajo.
- Margen de seguridad: US$0.05 por trabajo.
- Comisión de pago: 6.5 % + US$0.30 por cobro.
- Fuera del cálculo: costos fijos, soporte, devoluciones, impuestos y adquisición de clientes.

## Costo por motor

| Motor | Modo | Precio publicado | Costo efectivo supuesto | Créditos |
|---|---|---:|---:|---:|
| Sloyd | multi-image | US$0.40 | US$0.60 | 30 |
| Hunyuan3D 3.1 Pro | multi-image | US$0.82 | US$1.11 | 56 |
| Hunyuan3D 3.1 Rapid | image | US$0.38 | US$0.57 | 29 |
| Rodin 2.5 | multi-image | US$0.40 | US$0.60 | 30 |
| Rodin 2.5 Fast | multi-image | US$0.10 | US$0.24 | 12 |
| Tripo H3.1 | image | US$0.30 | US$0.48 | 24 |
| TRELLIS.2 | image | US$0.30 | US$0.48 | 24 |
| TRELLIS | image | US$0.02 | US$0.14 | 8 |
| Meshy 7.1 | image | US$0.60 | US$0.84 | 42 |

Casos extremos usados abajo: el más barato es TRELLIS (US$0.02) y el más caro Hunyuan3D 3.1 Pro (US$0.82).

## Del piso de 60 % al objetivo de 75–85 %

El piso de 60 % es el peor caso: el cliente gasta todos sus créditos. El objetivo de 75 %–85 % depende de cuánto usen en promedio. Esta tabla dice qué uso promedio da ese objetivo en cada paso de la barra.

| Plan | Precio | Créditos | Modelos, Rodin Fast | Modelos, Rodin 2.5 | Margen al 100 % | Uso para 85 % | Uso para 75 % |
|---|---:|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 200 | 16 | 6 | 71.7 % | 33 % | 80 % |
| Creator | US$49.00 | 550 | 45 | 18 | 70.6 % | 35 % | 80 % |
| Creator | US$59.00 | 650 | 54 | 21 | 71 % | 36 % | 82 % |
| Creator | US$69.00 | 750 | 62 | 25 | 71.3 % | 37 % | 83 % |
| Creator | US$79.00 | 900 | 75 | 30 | 70.3 % | 36 % | 80 % |
| Creator | US$89.00 | 1000 | 83 | 33 | 70.8 % | 36 % | 81 % |
| Commerce | US$99.00 | 1100 | 91 | 36 | 71.1 % | 37 % | 82 % |
| Commerce | US$119.00 | 1350 | 112 | 45 | 70.6 % | 36 % | 80 % |
| Commerce | US$139.00 | 1600 | 133 | 53 | 70.3 % | 36 % | 79 % |
| Commerce | US$159.00 | 1850 | 154 | 61 | 70.1 % | 36 % | 79 % |
| Commerce | US$179.00 | 2050 | 170 | 68 | 70.5 % | 36 % | 80 % |
| Studio | US$199.00 | 2300 | 191 | 76 | 70.3 % | 36 % | 79 % |
| Studio | US$249.00 | 2900 | 241 | 96 | 70.1 % | 36 % | 79 % |
| Studio | US$299.00 | 3450 | 287 | 115 | 70.3 % | 36 % | 80 % |
| Studio | US$399.00 | 4650 | 387 | 155 | 70.1 % | 36 % | 79 % |
| Studio | US$499.00 | 5800 | 483 | 193 | 70.2 % | 36 % | 79 % |

## Recargas sin suscripción (mínimo 60 %)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Recarga S (único) | US$15.00 | 150 | 18 | 74.2 % | 2 | 76.7 % |
| Recarga M (único) | US$40.00 | 450 | 56 | 72.6 % | 8 | 70.6 % |
| Recarga L (único) | US$100.00 | 1150 | 143 | 72.6 % | 20 | 71 % |

## Hipótesis del informe

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 150 | 18 | 78.3 % | 2 | 80.2 % |
| Creator | US$49.00 | 500 | 62 | 74.7 % | 8 | 74.8 % |
| Commerce | US$99.00 | 1100 | 137 | 73.3 % | 19 | 71.9 % |
| Studio | US$199.00 | 2400 | 300 | 71.6 % | 42 | 69.9 % |

## Intentos planos (descartado: no cumple el mínimo)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 25 | 25 | 72.9 % | 25 | -54.2 % |
| Growth | US$49.00 | 70 | 70 | 72.3 % | 70 | -65.7 % |
| Studio | US$99.00 | 160 | 160 | 69.9 % | 160 | -86.2 % |
| Trial pack (único) | US$9.00 | 8 | 8 | 77.3 % | 8 | -8.6 % |

## Si el costo real sube 50 % y no se actualizan los créditos

El mínimo se mantiene solo si los créditos por modelo se recalculan cuando cambia un costo. Esta tabla muestra lo que pasa si nadie lo hace.

| Estructura | Plan | Margen hoy, motor caro | Margen con +50 %, sin ajustar |
|---|---|---:|---:|
| Planes mensuales, cada paso de la barra (mínimo 60 %) | Starter | 74.4 % | 66.6 % |
| Recargas sin suscripción (mínimo 60 %) | Recarga S | 76.7 % | 70.1 % |
| Hipótesis del informe | Starter | 80.2 % | 75 % |
| Intentos planos (descartado: no cumple el mínimo) | Starter | -54.2 % | -119.3 % |

## Lectura

- **Objetivo:** 75–85 % de margen si los clientes usan, en promedio, entre un cuarto y un poco más de la mitad de sus créditos. Cuánto usarán de verdad solo se sabrá con clientes reales.
- **Sin acumulación:** el piso exige que los créditos del plan no pasen al mes siguiente. Si se acumularan, un cliente podría gastar más de lo que pagó ese mes.
- **Regla del dueño:** ningún plan puede bajar de 60 % de margen de contribución, aunque se use completo y con cualquier motor. Este script y las pruebas fallan si un plan la incumple.
- **Qué incluye ese margen:** es el precio menos el costo del proveedor y la comisión de pago. Con lo que queda se pagan hosting, soporte, devoluciones e impuestos, así que no es la ganancia final.
- **Intentos planos:** descartado. Un intento cuesta lo mismo con cualquier motor, así que un motor caro deja el plan con pérdida.
- **Créditos del informe:** cumple el mínimo, pero entrega menos modelos de los necesarios para llegar a 60 %.
- **Hasta medir costos reales** (Fase 10), estos márgenes son una estimación. Con facturas hay que actualizar los supuestos y repetir este cálculo.

## Motores por nivel (decisión documental, 2026-11-08)

No se enciende ninguno: faltan los términos de fal por escrito, una comparativa a ciegas con fotos reales (≈US$17 a precios publicados con los 9 motores, ≈US$9 con los 5 del cuadro) y gasto autorizado. Hoy el gasto autorizado es US$0. Costo efectivo y créditos salen de la tabla de arriba; se recalculan con el informe de precios cuando llegue.

| Nivel | Principal | Respaldo | Costo efectivo / créditos |
|---|---|---|---|
| Borrador | TRELLIS 1 | Rodin 2.5 Fast | 0,14 / 8 y 0,24 / 12 |
| Estándar | TRELLIS.2 | Hunyuan 3.1 Rapid | 0,48 / 24 y 0,57 / 29 |
| Premium multifoto | Rodin 2.5 | Hunyuan 3.1 Pro | 0,60 / 30 y 1,11 / 56 |
| Texto / paramétrico | Sloyd (piloto) | — | 0,60 / 30 |

### Selector de modelos (implementado, 2026-11-08)

El estudio tiene un control «Automático» que abre una barra con 8 modelos en 4 niveles y una calidad de textura (512 / 1K / 2K) con su costo en créditos. Créditos a calidad 1K y una foto, por precio publicado (no factura):

| Nivel | Modelo | Créditos (1K, 1 foto) |
|---|---|---:|
| Bajo costo | TRELLIS 1 | 8 |
| Bajo costo | Rodin 2.5 Fast | 12 |
| Normal | TRELLIS.2 (512: 21 · 1,5K: 27) | 24 |
| Normal | Sloyd (texto y paramétrico) | 23 |
| Normal | Hunyuan 3.1 Rapid | 29 |
| Premium | Rodin 2.5 | 30 |
| Súper premium | Hunyuan 3.1 Pro (56 con multivista) | 47 |
| Súper premium | Rodin 2.5 HighPack (US$0,40 + US$0,80) | 78 |

La calidad solo cambia el precio donde el proveedor la cobra distinta (hoy TRELLIS.2). Rodin tiene un único precio: el selector no inventa diferencias. 4K y el control de detalle no existen todavía. Todos los motores salvo Sloyd siguen apagados.

Tripo H3.1 y Meshy 7.1 quedan como opcionales: compiten con sus propios planes y, en Meshy, el precio por crédito es estimado. Con Starter de 200 créditos el rango es de 3 a 25 modelos al mes según el nivel; la web debe decir el rango. Con más de un motor encendido, la facturación por créditos es obligatoria (`billingConfigProblem()`).
