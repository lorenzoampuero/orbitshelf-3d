# Proyección de clientes e ingresos (simulada)

> **No son datos: son supuestos.** Hoy no hay clientes, ni tráfico, ni conversión medida. Sirve para ver qué números tendrían que darse para que el negocio se sostenga, no para prometer nada. Se regenera con `npx tsx --conditions=react-server scripts/project-customers.ts`.

## Supuestos

- Cobro: solo el precio base de cada plan (Starter US$19, Creator US$49, Commerce US$99, Studio US$199); nadie sube la barra. Es prudente.
- Costo variable: cada crédito usado cuesta US$0.02. Los créditos sin usar no cuestan.
- Comisión de pago: 6.5 % + US$0.3 por cobro (supuesto, sin proveedor de pago real).
- Costos fijos: US$150 al mes (hosting, base de datos, correo, dominio, herramientas) más US$1.5 por cliente (almacenamiento, descargas y soporte, hoy sin medir). No incluye tu sueldo ni impuestos.
- Costo de conseguir cada cliente nuevo: US$40 (publicidad, contenido, herramientas). Es el supuesto más incierto de todos y ya está descontado de la ganancia.
- Los nuevos clientes crecen cada mes durante el primer año y luego se mantienen. Los que se van se descuentan cada mes (abandono).
- No incluye clientes gratis ni prueba: cada cliente es de pago.

| Escenario | Nuevos en el mes 1 | Crecimiento mensual (año 1) | Abandono mensual | Uso de créditos | Mezcla Starter / Creator / Commerce / Studio |
|---|---:|---:|---:|---:|---|
| Prudente | 3 | 8 % | 10 % | 50 % | 60 % / 30 % / 9 % / 1 % |
| Base | 6 | 12 % | 7.000000000000001 % | 40 % | 50 % / 33 % / 14.000000000000002 % / 3 % |
| Optimista | 12 | 15 % | 5 % | 35 % | 40 % / 35 % / 20 % / 5 % |

## Resumen

| Escenario | Clientes mes 6 | Clientes mes 12 | Clientes mes 24 | Ingreso mensual mes 12 | Margen de contribución mes 12 | Ganancia mensual mes 12 | Primer mes con ganancia | Acumulado mes 12 | Acumulado mes 24 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Prudente | 18 | 37 | 61 | US$1,379 | 82 % | US$641 | mes 4 | US$2,643 | US$15,533 |
| Base | 42 | 110 | 219 | US$4,996 | 84 % | US$3,046 | mes 2 | US$14,785 | US$80,897 |
| Optimista | 95 | 289 | 669 | US$15,728 | 85 % | US$10,576 | mes 2 | US$50,610 | US$298,986 |

### Prudente

| Mes | Clientes | Ingreso | Costo de créditos | Comisiones | Costos fijos | Ganancia del mes (con captación) | Acumulado |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 3 | US$111 | US$12 | US$8 | US$155 | US$-184 | US$-184 |
| 3 | 9 | US$327 | US$36 | US$24 | US$163 | US$-36 | US$-329 |
| 6 | 18 | US$651 | US$72 | US$48 | US$176 | US$179 | US$-6 |
| 9 | 27 | US$994 | US$109 | US$73 | US$190 | US$399 | US$969 |
| 12 | 37 | US$1,379 | US$152 | US$101 | US$206 | US$641 | US$2,643 |
| 18 | 53 | US$1,945 | US$214 | US$142 | US$229 | US$1,081 | US$8,161 |
| 24 | 61 | US$2,247 | US$247 | US$164 | US$241 | US$1,314 | US$15,533 |

### Base

| Mes | Clientes | Ingreso | Costo de créditos | Comisiones | Costos fijos | Ganancia del mes (con captación) | Acumulado |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 6 | US$273 | US$24 | US$20 | US$159 | US$-170 | US$-170 |
| 3 | 19 | US$863 | US$77 | US$62 | US$178 | US$245 | US$108 |
| 6 | 42 | US$1,906 | US$169 | US$136 | US$213 | US$965 | US$2,251 |
| 9 | 71 | US$3,237 | US$287 | US$232 | US$257 | US$1,867 | US$6,901 |
| 12 | 110 | US$4,996 | US$443 | US$358 | US$315 | US$3,046 | US$14,785 |
| 18 | 176 | US$8,022 | US$712 | US$574 | US$414 | US$5,487 | US$42,118 |
| 24 | 219 | US$9,979 | US$885 | US$714 | US$479 | US$7,066 | US$80,897 |

### Optimista

| Mes | Clientes | Ingreso | Costo de créditos | Comisiones | Costos fijos | Ganancia del mes (con captación) | Acumulado |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12 | US$654 | US$51 | US$46 | US$168 | US$-91 | US$-91 |
| 3 | 40 | US$2,170 | US$169 | US$153 | US$210 | US$1,003 | US$1,341 |
| 6 | 95 | US$5,160 | US$403 | US$364 | US$292 | US$3,136 | US$8,460 |
| 9 | 173 | US$9,443 | US$737 | US$666 | US$410 | US$6,162 | US$23,675 |
| 12 | 289 | US$15,728 | US$1,227 | US$1,109 | US$583 | US$10,576 | US$50,610 |
| 18 | 508 | US$27,682 | US$2,160 | US$1,952 | US$912 | US$20,426 | US$150,010 |
| 24 | 669 | US$36,470 | US$2,846 | US$2,571 | US$1,154 | US$27,666 | US$298,986 |

## Cuántos clientes hacen falta (mezcla del escenario base)

Cada cliente deja unos US$37 al mes después de créditos, comisión y costos por cliente, sin contar lo que costó conseguirlo.

| Ganancia mensual deseada | Clientes de pago necesarios |
|---:|---:|
| US$500 | 18 |
| US$1,000 | 32 |
| US$3,000 | 86 |
| US$5,000 | 141 |

## Qué no dice esta proyección

- No sabemos cuántas visitas llegan, cuántas se registran ni cuántas pagan. Todo parte de un número inventado de clientes nuevos. Lo primero que hay que medir es esa conversión.
- El uso de créditos (35-50 %) es una suposición. Si los clientes usan todo, el margen baja hacia el 70 % de dimensionado; si usan poco, sube.
- Una pasada de prueba de motores cuesta unos US$62 y no está incluida. Tampoco los reembolsos, los impuestos ni el trabajo propio.
- Los costos reales de los motores y la comisión del cobro no se han confirmado con facturas.
