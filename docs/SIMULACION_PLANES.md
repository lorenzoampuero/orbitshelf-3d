# Simulación de planes

**Esto no es una oferta ni una decisión de precios.** Ningún motor se ha probado con dinero: los costos son precios publicados más supuestos sin medir. Sirve para comparar estructuras y detectar las que no funcionan. Hay que repetirla con facturas reales (Fase 10).

Generado con `scripts/simulate-plans.ts`. El detalle está en `PLANES_MARGEN_SIMULADO.csv`.

## Supuestos sin medir

- Reintentos facturados: 20 % del precio del proveedor.
- Conversión, almacenamiento y entrega: US$0.07 por trabajo.
- Margen de seguridad: US$0.05 por trabajo.
- Comisión de pago: 5 % + US$0.50 por cobro.
- Fuera del cálculo: costos fijos, soporte, devoluciones, impuestos y adquisición de clientes.

## Costo por motor

| Motor | Modo | Precio publicado | Costo efectivo supuesto | Créditos |
|---|---|---:|---:|---:|
| Sloyd | multi-image | US$0.40 | US$0.60 | 30 |
| Hunyuan3D 3.1 Pro | multi-image | US$0.68 | US$0.93 | 47 |
| Hunyuan3D 3.1 Rapid | image | US$0.38 | US$0.57 | 29 |
| Rodin 2.5 | multi-image | US$0.40 | US$0.60 | 30 |
| Rodin 2.5 Fast | multi-image | US$0.10 | US$0.24 | 12 |
| Tripo H3.1 | image | US$0.30 | US$0.48 | 24 |
| TRELLIS.2 | image | US$0.30 | US$0.48 | 24 |
| TRELLIS | image | US$0.02 | US$0.14 | 8 |
| Meshy 7.1 | image | US$0.60 | US$0.84 | 42 |

Casos extremos usados abajo: el más barato es TRELLIS (US$0.02) y el más caro Hunyuan3D 3.1 Pro (US$0.68).

## Planes mensuales (mínimo 60 %)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 300 | 37 | 64.3 % | 6 | 63 % |
| Creator | US$49.00 | 800 | 100 | 64.6 % | 17 | 61.7 % |
| Commerce | US$99.00 | 1700 | 212 | 63.7 % | 36 | 60.7 % |
| Studio | US$199.00 | 3400 | 425 | 64 % | 72 | 61.1 % |

## Recargas sin suscripción (mínimo 60 %)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Recarga S (único) | US$15.00 | 200 | 25 | 67.7 % | 4 | 66.9 % |
| Recarga M (único) | US$40.00 | 600 | 75 | 66.8 % | 12 | 65.9 % |
| Recarga L (único) | US$100.00 | 1600 | 200 | 65.7 % | 34 | 62.9 % |

## Hipótesis del informe

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 150 | 18 | 78.7 % | 3 | 77.7 % |
| Creator | US$49.00 | 500 | 62 | 75.8 % | 10 | 75 % |
| Commerce | US$99.00 | 1100 | 137 | 74.6 % | 23 | 72.9 % |
| Studio | US$199.00 | 2400 | 300 | 73 % | 51 | 70.9 % |

## Intentos planos (descartado: no cumple el mínimo)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 25 | 25 | 73.4 % | 25 | -30 % |
| Growth | US$49.00 | 70 | 70 | 73.4 % | 70 | -38.9 % |
| Studio | US$99.00 | 160 | 160 | 71.2 % | 160 | -55.8 % |
| Trial pack (único) | US$9.00 | 8 | 8 | 76.7 % | 8 | 6.8 % |

## Si el costo real sube 50 % y no se actualizan los créditos

El mínimo se mantiene solo si los créditos por modelo se recalculan cuando cambia un costo. Esta tabla muestra lo que pasa si nadie lo hace.

| Estructura | Plan | Margen hoy, motor caro | Margen con +50 %, sin ajustar |
|---|---|---:|---:|
| Planes mensuales (mínimo 60 %) | Starter | 63 % | 50.2 % |
| Recargas sin suscripción (mínimo 60 %) | Recarga S | 66.9 % | 56.1 % |
| Hipótesis del informe | Starter | 77.7 % | 71.3 % |
| Intentos planos (descartado: no cumple el mínimo) | Starter | -30 % | -83.3 % |

## Lectura

- **Regla del dueño:** ningún plan puede bajar de 60 % de margen de contribución, aunque se use completo y con cualquier motor. Este script y las pruebas fallan si un plan la incumple.
- **Qué incluye ese margen:** es el precio menos el costo del proveedor y la comisión de pago. Con lo que queda se pagan hosting, soporte, devoluciones e impuestos, así que no es la ganancia final.
- **Intentos planos:** descartado. Un intento cuesta lo mismo con cualquier motor, así que un motor caro deja el plan con pérdida.
- **Créditos del informe:** cumple el mínimo, pero entrega menos modelos de los necesarios para llegar a 60 %.
- **Hasta medir costos reales** (Fase 10), estos márgenes son una estimación. Con facturas hay que actualizar los supuestos y repetir este cálculo.
