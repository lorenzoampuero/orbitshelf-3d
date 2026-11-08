# Proyección de clientes e ingresos por canal (simulada)

> **No son datos: son supuestos.** Hoy no hay clientes, ni tráfico, ni conversión medida. Sirve para ver qué tendría que cumplirse para llegar a cada cifra y qué canal pesa más, no para prometer nada. Se regenera con `npx tsx --conditions=react-server scripts/project-customers.ts`. El análisis completo y las fuentes están en `docs/ESTUDIO_MERCADO.md`.

El mes 1 es el primer mes de ventas (diciembre de 2026, si el producto está listo a tiempo). Marzo de 2027 es el mes 4.

## Supuestos comunes

- Cobro: solo el precio base de cada plan (Starter US$19, Creator US$49, Commerce US$99, Studio US$199); nadie sube la barra. Es prudente.
- Costo variable: cada crédito usado cuesta US$0.02. Los créditos sin usar no cuestan. Comisión de pago: 6.5 % + US$0.3 por cobro (supuesto; Whop no está verificado).
- Costos fijos: US$150 al mes más US$1.5 por cliente. Costo único antes de la primera venta: US$60 (pruebas de motores y renders). No incluye tu sueldo, impuestos, abogado ni contador.
- Costo por cliente fuera de publicidad, sin contar tu tiempo: contacto directo US$30, contenido US$25, redes US$20.
- Publicidad pagada: el costo por cliente sale de `CPC ÷ (visita→registro × registro→pago)`. Empieza en el mes 3, después de tener una página que convierta.
- Cada cliente es de pago. No hay prueba gratis de generación (cada intento cuesta dinero), solo las muestras demo.

## Qué supone cada escenario

| Escenario | Abandono mensual | Uso de créditos | Contacto directo (nuevos/mes) | Contenido y SEO desde el mes 3 | Redes | Publicidad | Costo por cliente pagado |
|---|---:|---:|---|---|---|---|---:|
| Pesimista | 10 % | 50 % | 1.0 → 3.0 | +0.3 por mes cada mes | 0.5 → 1.5 | US$300/mes, CPC US$2, 2 % registra, 5 % paga | US$2,000 |
| Realista | 7 % | 40 % | 1.5 → 5.9 | +0.6 por mes cada mes | 1.0 → 3.0 | US$500/mes, CPC US$1.2, 3 % registra, 8 % paga | US$500 |
| Optimista | 5 % | 35 % | 3.0 → 11.8 | +1.5 por mes cada mes | 2.5 → 8.0 | US$1500/mes, CPC US$0.8, 4 % registra, 10 % paga | US$200 |

## Cuántos clientes de pago habría (activos, ya descontado el abandono)

| Escenario | Mes 3 (feb 2027) | Mes 4 (mar 2027) | Mes 6 (may 2027) | Mes 8 (jul 2027) | Mes 10 (sep 2027) | Mes 12 (nov 2027) |
|---|---:|---:|---:|---:|---:|---:|
| Pesimista | 6 | 8 | 15 | 23 | 31 | 40 |
| Realista | 10 | 16 | 31 | 48 | 67 | 88 |
| Optimista | 29 | 48 | 91 | 141 | 198 | 259 |

## Ingreso mensual recurrente (MRR, en US$)

| Escenario | Mes 3 | Mes 4 | Mes 6 | Mes 8 | Mes 10 | Mes 12 |
|---|---:|---:|---:|---:|---:|---:|
| Pesimista | 205 | 306 | 550 | 838 | 1,154 | 1,463 |
| Realista | 477 | 747 | 1,396 | 2,178 | 3,062 | 4,002 |
| Optimista | 1,571 | 2,593 | 4,953 | 7,700 | 10,795 | 14,119 |

## Ganancia del mes, después de costos y marketing, antes de tu sueldo (US$)

| Escenario | Mes 3 | Mes 4 | Mes 6 | Mes 8 | Mes 10 | Mes 12 | Acumulado mes 12 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pesimista | -358 | -296 | -141 | 49 | 268 | 491 | -37 |
| Realista | -379 | -194 | 266 | 833 | 1,487 | 2,192 | 7,536 |
| Optimista | -605 | 163 | 1,961 | 4,077 | 6,480 | 9,094 | 38,301 |

## De dónde vendrían los clientes nuevos (mes 4 y mes 12)

| Escenario | Mes | Contacto directo | Contenido y SEO | Redes | Publicidad | Total nuevos |
|---|---:|---:|---:|---:|---:|---:|
| Pesimista | 4 | 1.8 | 0.6 | 0.8 | 0.1 | 3.3 |
| Pesimista | 12 | 3.0 | 3.0 | 1.5 | 0.1 | 7.7 |
| Realista | 4 | 2.7 | 1.2 | 1.8 | 1.0 | 6.7 |
| Realista | 12 | 5.9 | 6.0 | 3.0 | 1.0 | 15.9 |
| Optimista | 4 | 5.4 | 3.0 | 4.3 | 7.5 | 20.2 |
| Optimista | 12 | 11.8 | 15.0 | 8.0 | 7.5 | 42.3 |

## Cuánto vale un cliente frente a lo que cuesta conseguirlo

Ganancia mensual por cliente (después de créditos, comisión y costo por cliente) × meses que se queda (1 ÷ abandono). Sin descontar al presente.

| Escenario | Ganancia mensual por cliente | Vida media | Valor de un cliente | Costo por cliente pagado | Valor ÷ costo (pagada) | ¿Alcanza para pagar publicidad? |
|---|---:|---:|---:|---:|---:|---|
| Pesimista | US$29 | 10 meses | US$287 | US$2,000 | 0.1× | No: cada cliente pagado pierde dinero |
| Realista | US$37 | 14 meses | US$524 | US$500 | 1.0× | Ajustado: pierde margen |
| Optimista | US$45 | 20 meses | US$898 | US$200 | 4.5× | Sí (3× o más) |

## Lectura

- **Meta de más de 10 clientes en marzo (mes 4):** el escenario realista llega a 16, el pesimista a 8 y el optimista a 48. En los tres casos casi todo viene del contacto directo y las redes, porque el contenido y el SEO recién empiezan y la publicidad arranca en el mes 3.
- **La publicidad pagada solo se justifica si la conversión es mucho mejor que la normal.** Con los supuestos realistas cada cliente pagado cuesta más de lo que deja. Antes de gastar en anuncios hay que medir visita→registro y registro→pago con tráfico real.
- **Lo que más mueve las cifras:** la conversión de la página (visita→pago), el abandono y subir la mezcla hacia Creator y Commerce. Cada punto ahí vale más que duplicar el presupuesto de anuncios.

## Qué no dice esta proyección

- No sabemos cuántas visitas llegan, cuántas se registran ni cuántas pagan. Es el primer número que hay que medir.
- Supone que el producto genera modelos reales desde el mes 1, que los motores se pueden revender (pendiente por escrito, ver `docs/INFORME_CODEX.md`) y que Whop cobra desde Chile. Si alguna falla, el mes 1 se corre.
- No incluye tu tiempo, impuestos, abogado, contador, reembolsos ni disputas. El uso de créditos y los costos de los motores no están medidos con facturas.
- Las cifras de CPC y conversión salen de agregadores y blogs de terceros, no de cuentas propias (ver fuentes en el estudio).
