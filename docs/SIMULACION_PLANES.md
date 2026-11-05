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

## Spec hypothesis (credits)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 150 | 18 | 78.7 % | 3 | 77.7 % |
| Creator | US$49.00 | 500 | 62 | 75.8 % | 10 | 75 % |
| Commerce | US$99.00 | 1100 | 137 | 74.6 % | 23 | 72.9 % |
| Studio | US$199.00 | 2400 | 300 | 73 % | 51 | 70.9 % |

## Current proposal (flat attempts)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Starter | US$19.00 | 25 | 25 | 73.4 % | 25 | -30 % |
| Growth | US$49.00 | 70 | 70 | 73.4 % | 70 | -38.9 % |
| Studio | US$99.00 | 160 | 160 | 71.2 % | 160 | -55.8 % |
| Trial pack (único) | US$9.00 | 8 | 8 | 76.7 % | 8 | 6.8 % |

## Prepaid packs only (credits, no subscription)

Margen de contribución con el plan usado al 100 %, el peor caso.

| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |
|---|---:|---:|---:|---:|---:|---:|
| Pack S (único) | US$15.00 | 250 | 31 | 61.9 % | 5 | 60.7 % |
| Pack M (único) | US$40.00 | 750 | 93 | 60.3 % | 15 | 58.9 % |
| Pack L (único) | US$100.00 | 2000 | 250 | 58.5 % | 42 | 55.4 % |

## Si los proveedores suben 50 %

| Estructura | Plan | Margen hoy, motor caro | Margen con +50 %, si no se ajusta nada |
|---|---|---:|---:|
| Spec hypothesis (credits) | Starter | 77.7 % | 71.3 % |
| Current proposal (flat attempts) | Starter | -30 % | -83.3 % |
| Prepaid packs only (credits, no subscription) | Pack S | 60.7 % | 47.1 % |

## Lectura

- **Intentos planos:** un intento cuesta lo mismo con cualquier motor, así que un motor caro se come el margen. Con más de un motor habilitado esta estructura es riesgosa. Por eso el libro ya admite créditos.
- **Créditos del informe:** el margen es alto en todos los casos, pero entrega pocos modelos por el precio. Conviene comparar con lo que ofrecen los competidores antes de decidir.
- **Paquetes sin suscripción:** no hay ingreso recurrente, pero tampoco hay que entregar créditos que no se usan. Puede servir para empezar a cobrar.

La decisión es del dueño, con datos de la Fase 10.
