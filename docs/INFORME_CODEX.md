# Informe de auditoría de OrbitShelf 3D

Fecha: 7 de noviembre de 2026. Estado: **auditoría con límites indicados**, no certificación de producción. Se examinaron código, pruebas, páginas públicas mediante Chrome y fuentes públicas. No se usaron servicios de pago ni claves reales de proveedor en las pruebas E2E; el servidor de pruebas emplea simuladores. La construcción de Next informó que cargó la configuración de entorno; no se inspeccionaron ni imprimieron sus valores.

## Resumen ejecutivo

1. **HECHO:** la portada ofrece crear un modelo, pero también advierte que aún no hay motor de IA conectado: riesgo de expectativas contradictorias (`src/i18n/dictionaries/es.ts:225`).
2. **HECHO:** Sloyd está marcado como piloto; los otros ocho motores están deshabilitados por defecto (`src/lib/provider/registry.ts:50`, `:65`, `:265`). Una variable puede habilitarlos para piloto (`:295`).
3. **HECHO:** las pruebas de Sloyd, fal y Shopify utilizan servidores falsos (`playwright.config.ts`); no prueban cobros, calidad ni compatibilidad real.
4. **HECHO:** los costos y márgenes son supuestos, no facturas. Con los supuestos establecidos, el mínimo conservador calculado para planes es 67,71 %.
5. **HECHO:** fal permite acceso a usuarios finales por una solución API, pero sus términos generales también restringen ciertos esquemas de reventa y service bureau. La aplicación concreta requiere aclaración escrita.
6. **HECHO:** Whop publica 2,9 % + US$0,30 para tarjeta procesada localmente en Chile; las condiciones de la cuenta y el eventual 3 % adicional siguen sin confirmar.
7. **HECHO:** Shopify se anuncia como próximamente; existe implementación probada con simulador, no una integración real verificada.
8. **HECHO:** los límites de tasa recurren a memoria por proceso si falla la base de datos; el límite compartido se degrada en una instalación con varias instancias.
9. **HECHO:** cambiar a español desde una ruta `/en/...` lleva a `/es/en/...` y responde 404.
10. **SUPOSICIÓN:** antes de vender, conviene validar condiciones comerciales, calidad y costos reales, además de completar el recorrido visual y la revisión de seguridad pendientes.

## Hallazgos

| ID | Gravedad | Hecho y reproducción | Evidencia | Propuesta | Esfuerzo estimado |
|---|---|---|---|---|---|
| H01 | Alta | La cabecera invita a generar desde una foto; la misma página indica que aún no hay motor conectado. Abrir `/es` y comparar el primer bloque con «Qué esperar». | `src/i18n/dictionaries/es.ts:225`; portada observada en Chrome | Aclarar la disponibilidad junto al primer CTA y dirigir a demo/importación mientras no esté disponible. | 2–4 h |
| H02 | Alta | Sin pruebas reales de proveedor o Shopify, las pruebas E2E no demuestran su comportamiento comercial real. | `playwright.config.ts`; `tests/e2e/app.spec.ts:263`, `:739` | Mantener estados de piloto y planificar pruebas autorizadas con límites de gasto y cuentas separadas. | 8–20 h, sin contar licencias ni gasto |
| H03 | Alta | Los términos de fal describen tanto integración con usuarios finales como restricciones de reventa; no se ha establecido su aplicación a este producto. | `src/lib/provider/registry.ts:65`; [términos §4 y §6](https://fal.ai/legal/terms-of-service), [términos API §2](https://fal.ai/legal/api-services) | Pedir autorización y condiciones por escrito para cada motor y forma de entrega. | 2–6 h más espera |
| H04 | Media | Si la base compartida del limitador falla, se usa un límite independiente por proceso. En varias instancias el límite total puede crecer. | `src/lib/rate-limit.ts:45` | Definir política ante caída y limitación compartida con monitoreo. | 6–12 h |
| H05 | Media | Build local de producción emitió aviso de URL pública ausente; canonical/hreflang quedan relativos en ese entorno. | `src/lib/seo.ts:16` y salida de `npm run build` | Configurar y verificar el dominio de producción en el despliegue. | 1–2 h |
| H06 | Media | Los costos de reintentos, procesamiento y comisión son parámetros supuestos. Los márgenes no prueban rentabilidad real. | `src/lib/credits.ts:14` | Medir facturas, costos de fallos y tarifa contractual antes de fijar precios. | 4–8 h más piloto |

| H07 | Media | En `/en/features`, pulsar ES navega a `/es/en/features` y muestra 404. El mismo patrón afecta las rutas explícitas `/en` verificadas. | `src/i18n/config.ts:16`; `src/components/locale-switcher.tsx:11`; `docs/screenshots/codex/recorrido.json` | Eliminar ambos prefijos antes de construir la ruta, o redirigir `/en` a la URL inglesa canónica; cubrir el selector con pruebas. | 2–4 h |
| H08 | Alta | Los webhooks públicos de fal y Shopify leen el cuerpo completo con `arrayBuffer()` antes de comparar con 1 MB; un cuerpo mayor puede ocupar memoria antes de recibir 413. Reproducible por inspección de código; no se realizó prueba de carga. Shopify solo llega a lectura si está configurado. | `src/app/api/webhooks/fal/route.ts:17`; `src/app/api/webhooks/shopify/route.ts:17` | Leer flujo con límite durante la recepción, con límites de proxy y pruebas de tamaño. | 3–6 h |

**Recorrido automatizado:** 19 rutas × 2 idiomas × 2 tamaños = 76 visitas y capturas; 72 respuestas 200 y 4 respuestas 404 esperadas para la ruta inexistente. Ninguna de las 76 páginas presentó ancho de documento mayor al viewport. Entre 89 enlaces internos únicos extraídos, 18 respondieron 404: son variantes `/es/en/...` causadas por H07. En consola se observaron errores 404 asociados a esos enlaces precargados; en la primera portada española hubo un 404 que no se pudo atribuir en la repetición. No se realizó inspección visual completa de las 76 capturas ni se demostró ausencia de errores de contraste o foco. La suite E2E incluye axe, tamaño de fuente y ancho móvil para su conjunto de rutas, sin equivaler a una auditoría manual exhaustiva. Evidencia en `docs/screenshots/codex/recorrido.json`.
Las horas son estimaciones orientativas, no mediciones. No se demostraron vulnerabilidades de aislamiento, SSRF o duplicación en esta revisión parcial.

## Afirmaciones y estado

Las categorías indican el alcance probado; «solo simulado» no equivale a operación real.

| Afirmación | Clasificación y evidencia |
|---|---|
| Texto/foto a modelo | Solo simulado: adaptadores y flujo E2E con mock Sloyd (`tests/e2e/app.spec.ts:263`, `:865`); motor real sin comprobar. |
| Precios, créditos, estimación de modelos | Funciona y está probado como simulación local: fórmulas `src/lib/credits.ts`, prueba del deslizador `tests/e2e/app.spec.ts:908`; no hay compra real comprobada. |
| GLB, OBJ y STL | Funciona y está probado en flujo local de importación/exportación (`tests/e2e/app.spec.ts:464`); no prueba calidad de salida real de motores. |
| Revisión antes de publicación | Funciona y está probado para visor y flujo de prueba (`tests/e2e/app.spec.ts:119`, `:650`); no demuestra restricciones sobre una descarga externa posterior. |
| Shopify | Solo simulado: prueba de conexión y publicación contra servidor falso (`tests/e2e/app.spec.ts:739`). La web lo marca próximamente. |
| API pública | Funciona y está probado en entorno simulado (`tests/e2e/app.spec.ts:802`); verificar despliegue real y permisos antes de abrirlo. |
| MCP | Funciona sin probar independientemente en esta auditoría; la propia web indica cliente de prueba propio (`src/content/solutions.ts:216`). |
| Blender | Funciona sin probar independientemente: la portada indica que el complemento no se ha ejecutado en Blender. |
| WooCommerce, Unity y Unreal | No existe integración activa confirmada: web los presenta como planificados/futuros. Exportar GLB no equivale a una integración nativa. |

## Precios y márgenes

**HECHO, recálculo independiente:** crédito = US$0,02 de costo supuesto; comisión = 6,5 % + US$0,30. Para precio P, créditos = `50 × floor(((0,235 × P − 0,30)/0,02)/50)`. El margen conservador con gasto completo y aumento del 10 % de **todo el costo variable estimado** = `1 − 0,065 − 0,30/P − créditos × 0,02 × 1,10/P`. Es una cota conservadora: la simulación efectiva redondea trabajos a enteros y calcula costo por trabajo. No incluye costos fijos, soporte, devoluciones ni impuestos. El 10 % se aplicó a todo el costo variable, por lo que cubre el caso de aumentar solo el motor si los demás costos permanecen iguales.

| Plan / precio USD | Créditos | Margen conservador |
|---|---:|---:|
| Starter 19 | 200 | 68,76 % |
| Creator 49 / 59 / 69 / 79 / 89 | 550 / 650 / 750 / 900 / 1000 | 68,19 / 68,75 / 69,15 / 68,06 / 68,44 % |
| Commerce 99 / 119 / 139 / 159 / 179 | 1100 / 1350 / 1600 / 1850 / 2050 | 68,75 / 68,29 / 67,96 / 67,71 / 68,14 % |
| Studio 199 / 249 / 299 / 399 / 499 | 2300 / 2900 / 3450 / 4650 / 5800 | 67,92 / 67,76 / 68,02 / 67,79 / 67,87 % |

Los tres packs de US$15/40/100 y 150/450/1150 créditos dan, con la misma cota, 69,50/68,00/67,90 %. Ningún paso calculado cae bajo el 60 %. `check-fee-scenarios.ts` informó mínimos 67,7 %, 68,5 %, 65,5 % y 63,5 % en sus cuatro escenarios; el primero coincide con la cota de 67,71 % redondeada. `simulate-plans.ts` se ejecutó y regeneró sus dos informes existentes. No se auditó exhaustivamente cada combinación de motor y opción ni se verificaron facturas reales.

**Concurrencia y reembolsos:** Postgres bloquea la organización, consulta idempotencia y saldo antes del débito (`src/lib/store-postgres.ts:339`); el reembolso usa una clave por modelo (`:375`). Esto es evidencia de diseño y pruebas locales, no una demostración exhaustiva en producción distribuida. No se detectó un sobre-reembolso mediante esta lectura parcial.

### Competidores (fuentes oficiales consultadas el 7-11-2026)

| Servicio | Precio y alcance | Costo indicativo, no comparable automáticamente |
|---|---|---|
| [Meshy](https://docs.meshy.ai/en/webapp/pricing) | Planes y consumo por operación; Meshy 6/7 indicados como 20 créditos por generación. [Proveedor](https://www.meshy.ai/blog/which-meshy-plan-is-right-for-you) indica Pro US$20/mes y 1000 créditos. | 20/1000 × US$20 = US$0,40 por generación de 20 créditos si se usa todo, sin extras; datos de webapp, no necesariamente API. |
| [Tripo](https://www.tripo3d.ai/product-doc/getting-started/pricing-credits) | Professional US$20 mensual, 3000 créditos; H3.1 15 créditos; texturas y otras operaciones pueden sumar. | US$0,10 por generación básica con uso íntegro; la propia página comercial muestra otra cifra por modelo, por lo que confirmar el alcance. |
| [Hyper3D Rodin](https://hyper3d.ai/pricing) | Creator US$30 mensual, estimación de unos 60 modelos; Business incorpora API. | Aproximadamente US$0,50 por modelo estimado, no precio API. |
| [Sloyd API](https://www.sloyd.ai/api/pricing) | Créditos API prepagos separados del plan web. [Fuente oficial explicativa](https://www.sloyd.ai/blog/best-3d-model-generation-apis): 75 créditos/US$, imagen texturizada 20, texto 25. | Aproximadamente US$0,27 por imagen o US$0,33 por texto, antes de extras. |

## Whop: datos y diseño propuesto

Fuentes oficiales consultadas el **7-11-2026**. Sus tarifas pueden variar por cuenta, producto, región y contrato; no son una cotización aprobada para esta empresa.

### Tarifas de cobro

[Tarifas regionales oficiales](https://docs.whop.com/payments-and-billing/fees/regional-fees): la tarifa depende de **dónde se procesa el pago**, no solamente del país del vendedor. Para tarjeta procesada localmente en Chile indica **2,9 % + US$0,30** y no añade el recargo internacional; para EE. UU., Canadá, UE, Reino Unido y Australia indica 2,7 % + US$0,30. Si se procesa en EE. UU. con tarjeta o cliente de fuera de EE. UU., la página describe +1,5 %. La conversión puede añadir 1 %; la página señala una excepción cuando aplica adaptive pricing. Consultar el detalle del pago, no sumar recargos automáticamente.

Para métodos locales de Chile, la misma fuente indica Sencillito **3,9 % + US$0,30**, Servipag **3,9 % + US$3,00**, Webpay/Mercado Pago **4,9 % + US$0,30**; sustituyen la tasa de tarjeta y pueden tener otros cargos aplicables. Su disponibilidad para este producto y la capacidad de pagos recurrentes mediante cada método deben confirmarse. [Tarifas generales](https://docs.whop.com/fees): Billing 0,5 % si está activado; orquestación 0,8 % si se activa; impuestos 2 % si se habilita y recauda, según esa página. Los [términos del vendedor §6A](https://whop.com/seller-terms/) describen 2 % para los dos modos de impuesto asistido; confirmar el supuesto exacto de cobro ante esa diferencia. Whop también enumera 3DS US$0,03, Radar US$0,07 y disputa US$15 cuando correspondan.

**Ejemplo aritmético, no cotización:** pago de US$19 procesado en Chile con tarjeta local y Billing, sin otros cargos: 19 × (2,9 % + 0,5 %) + 0,30 = **US$0,946**, aproximadamente US$0,95; neto antes de impuestos, retiros y demás costos US$18,05. Con Webpay y sin Billing: 19 × 4,9 % + 0,30 = **US$1,231**, aproximadamente US$1,23. El redondeo de Whop y el cambio de moneda no se han comprobado.

**¿3 % de plataforma adicional?** La página oficial de tarifas revisada no enumera una tasa general adicional del 3 % para Whop Payments en sitio propio. Eso **no demuestra que ninguna cuenta, contrato o canal tenga una comisión adicional**: sus términos mencionan tarifa de servicio y remiten a la configuración aplicable. Pedir a Whop una cotización desglosada por canal y revisar `Retrieve Account Fees`. El escenario con 3 % del simulador es una hipótesis de estrés, no un hecho confirmado.

### Merchant of record e impuestos

Los [términos del vendedor §§1 y 6A](https://whop.com/seller-terms/) describen a Whop como merchant of record para reglas de tarjetas y liquidación; el vendedor sigue siendo proveedor para soporte, licencias, protección al consumidor y demás obligaciones. En ajustes fiscales se puede elegir **Whop Collects and Remits** donde esté disponible: en ese modo Whop asume un papel limitado de merchant of record respecto de los impuestos de transacción cubiertos. Los términos enumeran 18 estados de EE. UU., Reino Unido y UE, no Chile, para ese modo. El vendedor debe determinar y verificar sus obligaciones. **No asumir que Whop presenta automáticamente impuestos chilenos ni que cubre todo el mundo.** Confirmar activación y elegibilidad de la cuenta y recibir asesoría aplicable.

### Retiros a Chile

La [API oficial de retiros](https://docs.whop.com/api-reference/withdrawals/retrieve-withdrawal) enumera CLP como moneda posible y campos de comisión y fecha estimada, sin garantizar que una cuenta concreta pueda retirar en CLP. [Fuente de tercero Pendym](https://pendym.com/shopify-payments/chile), que dice haber consultado la documentación el 19-09-2026, informa que Chile figura entre países admitidos, que los métodos se muestran según cuenta/país y que se requiere verificación; **no se verificó directamente la lista oficial de países**. La [tarifa oficial general](https://docs.whop.com/fees) indica que transferencias a bancos locales internacionales varían por país. Método habilitado en Chile, tipo de cambio efectivo, monto mínimo, costo y plazo concretos: **sin verificar**. Pedir desglose escrito y comprobar en la cuenta antes de vender.

### Admisibilidad y créditos

[Política oficial de productos prohibidos](https://whop.com/prohibited-products-and-services/) prohíbe material que infrinja derechos, pero la revisión no encontró una prohibición específica de créditos para generación 3D. **Esto no es una aprobación** de OrbitShelf ni prueba derechos de motores ajenos. Los [términos del vendedor §3](https://whop.com/seller-terms/) exigen indicar duración y entrega y prohíben accesos indefinidos; consultar cómo aplicar esta regla a recargas y caducidad. Pedir a Whop aceptación escrita del modelo de créditos, resultado de terceros, licencias, suscripciones y políticas de reembolso. No se verificó un saldo de créditos de generación nativo para esta aplicación; diseñar el libro propio.

### Integración propuesta, no implementada

[Planes Whop](https://docs.whop.com/api-reference/plans/create-plan) admiten `one_time` y `renewal`; usar checkout de pago único para recargas y recurrente para planes, enlazando organización e intención mediante identificador interno no sensible. Crear `billing_customers`, `billing_products`, `billing_orders`, `billing_subscriptions`, `billing_events` y un asiento único del libro por pago/período. El servidor crea la intención y checkout y la interfaz nunca acredita por una redirección.

[Webhooks oficiales](https://docs.whop.com/developer/guides/webhooks): verificar firma sobre cuerpo crudo con `unwrapWebhook`, procesar `payment.succeeded`, y registrar de forma durable antes de responder; también tratar `payment.failed`, cambios de membresía, devoluciones y disputas según eventos verificados en implementación. Guardar ID de evento único y asociar pago, moneda, importe, producto, organización y período desde datos confiables. En una transacción, asegurar unicidad por ID de pago y por período, y acreditar el libro una sola vez; reintentos y eventos desordenados no deben duplicar saldo. Reconciliar pagos con Whop y aplicar compensaciones auditables ante reembolsos y disputas. Nunca registrar firmas, secretos ni cuerpos innecesarios.

La [API de idempotencia](https://docs.whop.com/developer/api/idempotency) acepta `Idempotency-Key` en POST autenticados, con respuesta conservada 24 horas; conservar además un identificador único permanente propio, pues la protección de Whop vence. Usar una clave por operación y la misma al reintentar; no confiar solo en la ventana de 24 horas. Confirmar eventos de renovación, caducidad y devolución, así como condiciones del checkout para los medios locales, antes de implementar.

## Licencias de motores

No es asesoría legal. Consulta de fuentes el 7-11-2026. Los ocho motores deshabilitados pueden habilitarse para piloto mediante configuración; deshabilitado por defecto no equivale a licencia concedida.

| Motor registrado | Hallazgo oficial y pregunta escrita |
|---|---|
| Sloyd | [Términos §§6–7](https://www.sloyd.ai/pt/terms-of-use) describen modelos de webapp, uso comercial y redistribución bajo condiciones; [Sloyd aclara que API es separada](https://www.sloyd.ai/sloyd-answers). Derechos de salida API para un SaaS de terceros: **sin verificar**. Preguntar por entrega, sublicencia, venta, atribución y plan API. |
| Meshy 7.1 | [Términos §2.4](https://www.meshy.ai/terms-of-use) y [licencias por plan](https://docs.meshy.ai/en/webapp/pricing) distinguen salida y plan. Uso de API para entregar modelos generados a clientes y sublicenciar: **sin verificar**. Pedir condiciones aplicables a API y atribución. |
| Hunyuan 3.1 Pro / Rapid por fal | [Términos fal §4 y §6](https://fal.ai/legal/terms-of-service), [suplemento API §2](https://fal.ai/legal/api-services) permiten integrar acceso de usuarios finales bajo condiciones, pero existen restricciones de reventa/service bureau; licencias particulares del modelo y territorios: **sin verificar**. Preguntar a fal y titular del modelo. |
| Rodin 2.5 / 2.5 Fast por fal | Mismas condiciones generales de fal; derechos específicos de Hyper3D para revender/sublicenciar resultados mediante fal: **sin verificar**. Preguntar a ambos. |
| Tripo H3.1 por fal | Mismas condiciones generales de fal; [Tripo](https://www.tripo3d.ai/product-doc/getting-started/pricing-credits) distingue derechos de webapp por plan. Aplicación al endpoint de fal: **sin verificar**. Preguntar a ambos. |
| TRELLIS / TRELLIS.2 por fal | Mismas condiciones generales de fal; términos del modelo concreto, sus pesos y atribución para salida comercial mediante fal: **sin verificar**. Preguntar a fal y titulares. |

## Calidad y seguridad

- `npm run lint` y `npx tsc --noEmit`: ambos terminaron con código 0 en ejecuciones independientes.
- `npm test`: 24 archivos aprobados, uno omitido; 271 pruebas aprobadas y una omitida.
- `npm run build`: compiló y generó 78 páginas; aviso SEO indicado arriba.
- `npm run test:e2e`: se observaron 17 casos individuales aprobados, incluyendo acceso no autorizado, CSRF, aislamiento, mocks, axe y desbordamiento móvil (`tests/e2e/app.spec.ts:1029`). El proceso quedó detenido durante el cierre y se interrumpió; no se obtuvo un resultado global ni código de salida satisfactorio.
- `src/lib/api.ts:24` comprueba origen en mutaciones de sesión; `:67` limita lectura de cuerpo. El test E2E cubre 401 y rechazo CSRF, y otro cubre aislamiento de dos usuarios. Esto no cubre todas las rutas ni configuraciones de proxy.
- `src/lib/webhooks.ts:38` bloquea redes privadas y `:61` valida DNS al conectar; no sigue redirecciones. No se afirma que la lista cubra todos los rangos especiales posibles.
- No se completó revisión sistemática de todas las rutas, logs, cargas, autenticación y límites; no puede descartarse exposición de secretos ni otros fallos.

## Prioridades y decisiones

1. Alinear CTA y disponibilidad efectiva; mantener visiblemente el estado de vista previa.
2. Pedir por escrito licencias de API y condiciones de Whop, incluidos Chile, impuestos y producto de créditos.
3. Medir costos, calidad y reembolsos en piloto solo cuando exista presupuesto expresamente autorizado.
4. Completar auditoría de seguridad y pruebas en configuración de despliegue multiinstancia.
5. Decidir proveedor de pagos, motor inicial, política de créditos, devoluciones y jurisdicciones; luego diseñar implementación definitiva.
6. Configurar URL pública al desplegar y comprobar metadatos.

## Sin verificar y límites de esta auditoría

- Se recorrieron automáticamente 19 rutas en dos idiomas y dos anchos; falta inspección visual detallada, teclado y contraste de todas las páginas.
- Se guardaron 76 capturas en `docs/screenshots/codex/`, con resultados por URL en `recorrido.json`.
- No se probaron proveedores, Shopify, Whop, Supabase ni correos reales; no se comprobaron costes facturados, calidad de modelos, condiciones específicas de la cuenta, retiro a Chile o cumplimiento legal.
- No se compararon exhaustivamente todos los textos entre idiomas; se detectó el fallo del selector ES desde rutas explícitas `/en`.
- No se comprobó cada licencia específica de cada modelo de terceros ni la atribución aplicable a cada endpoint.
- La revisión de reembolsos, concurrencia, seguridad y afirmaciones comerciales no es exhaustiva; ausencia de hallazgos adicionales no demuestra ausencia de defectos.




- Durante la comprobación de enlaces, el servidor registró dos excepciones TypeError: Cannot read properties of null (reading 'orgId'); no se identificó con certeza la ruta ni la causa, por lo que queda pendiente reproducirlas de forma aislada.

