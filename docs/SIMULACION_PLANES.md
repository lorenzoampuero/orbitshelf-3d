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
| Starter | US$19.00 | 250 | 20 | 8 | 67.1 % | 28 % | 66 % |
| Creator | US$49.00 | 700 | 58 | 23 | 65.6 % | 31 % | 66 % |
| Creator | US$59.00 | 850 | 70 | 28 | 65.7 % | 32 % | 66 % |
| Creator | US$69.00 | 1000 | 83 | 33 | 65.4 % | 32 % | 67 % |
| Creator | US$79.00 | 1150 | 95 | 38 | 65.5 % | 32 % | 67 % |
| Creator | US$89.00 | 1350 | 112 | 45 | 64.1 % | 31 % | 64 % |
| Commerce | US$99.00 | 1500 | 125 | 50 | 64.2 % | 31 % | 64 % |
| Commerce | US$119.00 | 1800 | 150 | 60 | 64.3 % | 32 % | 65 % |
| Commerce | US$139.00 | 2100 | 175 | 70 | 64.4 % | 32 % | 65 % |
| Commerce | US$159.00 | 2400 | 200 | 80 | 64.5 % | 32 % | 65 % |
| Commerce | US$179.00 | 2700 | 225 | 90 | 64.6 % | 32 % | 65 % |
| Studio | US$199.00 | 3050 | 254 | 101 | 64.1 % | 32 % | 64 % |
| Studio | US$249.00 | 3800 | 316 | 126 | 64.3 % | 32 % | 65 % |
| Studio | US$299.00 | 4600 | 383 | 153 | 64.1 % | 32 % | 64 % |
| Studio | US$399.00 | 6150 | 512 | 205 | 64 % | 32 % | 64 % |
| Studio | US$499.00 | 7700 | 641 | 256 | 64.1 % | 32 % | 64 % |

## Recargas sin suscripción (mínimo 60 %)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Recarga S (único) | US$15.00 | 200 | 25 | 67.7 % | 3 | 69.5 % |
| Recarga M (único) | US$40.00 | 550 | 68 | 69.3 % | 9 | 68.8 % |
| Recarga L (único) | US$100.00 | 1500 | 187 | 67.6 % | 26 | 65.6 % |

## Hipótesis del informe

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 150 | 18 | 78.7 % | 2 | 80.7 % |
| Creator | US$49.00 | 500 | 62 | 75.8 % | 8 | 75.9 % |
| Commerce | US$99.00 | 1100 | 137 | 74.6 % | 19 | 73.2 % |
| Studio | US$199.00 | 2400 | 300 | 73 % | 42 | 71.3 % |

## Intentos planos (descartado: no cumple el mínimo)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 25 | 25 | 73.4 % | 25 | -53.7 % |
| Growth | US$49.00 | 70 | 70 | 73.4 % | 70 | -64.6 % |
| Studio | US$99.00 | 160 | 160 | 71.2 % | 160 | -84.9 % |
| Trial pack (único) | US$9.00 | 8 | 8 | 76.7 % | 8 | -9.2 % |

## Si el costo real sube 50 % y no se actualizan los créditos

El mínimo se mantiene solo si los créditos por modelo se recalculan cuando cambia un costo. Esta tabla muestra lo que pasa si nadie lo hace.

| Estructura | Plan | Margen hoy, motor caro | Margen con +50 %, sin ajustar |
|---|---|---:|---:|
| Planes mensuales, cada paso de la barra (mínimo 60 %) | Starter | 69 % | 58.6 % |
| Recargas sin suscripción (mínimo 60 %) | Recarga S | 69.5 % | 59.6 % |
| Hipótesis del informe | Starter | 80.7 % | 75.5 % |
| Intentos planos (descartado: no cumple el mínimo) | Starter | -53.7 % | -118.8 % |

## Lectura

- **Objetivo:** 75–85 % de margen si los clientes usan, en promedio, entre un cuarto y un poco más de la mitad de sus créditos. Cuánto usarán de verdad solo se sabrá con clientes reales.
- **Sin acumulación:** el piso exige que los créditos del plan no pasen al mes siguiente. Si se acumularan, un cliente podría gastar más de lo que pagó ese mes.
- **Regla del dueño:** ningún plan puede bajar de 60 % de margen de contribución, aunque se use completo y con cualquier motor. Este script y las pruebas fallan si un plan la incumple.
- **Qué incluye ese margen:** es el precio menos el costo del proveedor y la comisión de pago. Con lo que queda se pagan hosting, soporte, devoluciones e impuestos, así que no es la ganancia final.
- **Intentos planos:** descartado. Un intento cuesta lo mismo con cualquier motor, así que un motor caro deja el plan con pérdida.
- **Créditos del informe:** cumple el mínimo, pero entrega menos modelos de los necesarios para llegar a 60 %.
- **Hasta medir costos reales** (Fase 10), estos márgenes son una estimación. Con facturas hay que actualizar los supuestos y repetir este cálculo.
