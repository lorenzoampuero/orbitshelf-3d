# Prompt para Codex: investigar OrbitShelf 3D usando la web

Copia el bloque de abajo en Codex, con la carpeta `orbitshelf-3d` abierta.

```text
Eres un auditor técnico y de producto. Trabajas sobre OrbitShelf 3D, un SaaS que convierte fotos o texto en modelos 3D para tiendas, estudios de juegos y diseñadores 3D. Vive en esta carpeta (Next.js 16, React 19, TypeScript, Tailwind 4, Vitest, Playwright).

REGLAS (no negociables)
- Lee AGENTS.md primero. Esta versión de Next.js tiene cambios incompatibles: antes de usar una API que no conozcas, lee node_modules/next/dist/docs/.
- No hagas git push ni abras PRs. No gastes dinero: no llames a APIs de pago (fal, Meshy, Sloyd, Whop, Supabase) y no uses claves reales. Todo se prueba con los simuladores y datos de prueba que ya trae el repo.
- No leas ni imprimas archivos .env ni secretos.
- No modifiques código en esta fase. Solo investiga e informa. Escribe el informe en docs/INFORME_CODEX.md.
- Separa siempre HECHO VERIFICADO (lo probaste o lo viste en el código, con archivo:línea o captura) de SUPOSICIÓN (lo infieres). Si no pudiste comprobar algo, dilo.
- Responde en español.

PASO 1: levantar y recorrer la web
1. npm install (si hace falta), luego npm run dev y abre http://localhost:3000 (español en /es, inglés en /en).
2. Recorre con un navegador (Playwright sirve) estas rutas en escritorio (1280 px) y móvil (375 px): inicio, /features y sus 3 subpáginas, /solutions y sus 3 subpáginas, /integrations, /how-it-works, /examples, /pricing, /resources, /compare/ai-3d-vs-manual, /login, /privacy, /terms, y una URL inexistente.
3. Guarda capturas en docs/screenshots/codex/. Anota todo lo roto: desbordes, texto ilegible, enlaces muertos, errores de consola, contraste insuficiente, foco de teclado perdido, textos distintos entre /es y /en.

PASO 2: verificar cada afirmación de la web contra el código
Para cada cosa que la web promete (precios, créditos al mes, "modelos estimados", estados de integraciones, formatos de exportación, revisión antes de publicar, API, MCP, Blender, Unity, WooCommerce, Shopify), encuentra el código que la respalda y clasifícala: Funciona y está probado / Funciona sin probar / Solo simulado / No existe. Señala cualquier texto que prometa más de lo que el código hace.

PASO 3: precios y márgenes
1. Lee src/lib/credits.ts. Recalcula a mano, de forma independiente, los créditos de cada paso de cada plan y el margen a uso total con costo de motor +10 %.
2. Reproduce el resultado con: npx tsx --conditions=react-server scripts/check-fee-scenarios.ts y scripts/simulate-plans.ts. Compara.
3. Busca errores: redondeos, un paso que quede bajo el piso de 60 %, créditos que el cliente pueda gastar por encima de lo cobrado, reembolsos que se pasen, condiciones de carrera al descontar saldo.
4. Contrasta los precios con competidores públicos (Meshy, Tripo, Rodin/Hyper3D, Sloyd): cuánto cobran por modelo y qué ofrecen. Cita la URL y la fecha de cada dato. No copies textos.

PASO 4: pagos con Whop
Investiga en la documentación oficial de Whop (docs.whop.com) y en fuentes que cites con URL:
- Comisiones reales por cobro (procesamiento, tarjeta internacional, cambio de moneda, facturación, impuestos) y si existe o no una comisión de plataforma del 3 % para cobros desde un sitio propio.
- Si Whop actúa como comerciante de registro y cómo se activa.
- Cómo cobrar suscripciones mensuales y recargas desde un sitio propio por API/SDK y recibir webhooks; si hay saldo prepago nativo.
- Retiros a Chile: métodos, costos y plazos.
- Si sus políticas permiten vender créditos de generación de modelos 3D por IA, y cómo tratan la reventa de resultados de motores de terceros.
Marca cada dato como oficial o de tercero, con fecha. Diseña (sin implementar) el flujo de integración con esta app: qué tablas, qué webhooks, cómo evitar cobros duplicados y cómo acreditar créditos de forma idempotente.

PASO 5: licencias de los motores
Para cada motor registrado en src/lib/provider/registry.ts, busca en sus términos oficiales si se permite revender los modelos generados dentro de un servicio de terceros (reventa, sublicencia, uso comercial del resultado, atribución). Cita la cláusula con URL y fecha. Si los términos callan o no los encuentras, di "sin verificar". No des consejo legal; di qué habría que preguntarle por escrito a cada proveedor.

PASO 6: seguridad y calidad
- npm run lint, npx tsc --noEmit, npm test, npm run build y npm run test:e2e (detén antes el servidor de desarrollo: dev y build chocan en .next). Informa qué pasa y qué falla.
- Revisa rutas /api y src/lib: autenticación, aislamiento entre clientes, CSRF, subida de archivos, SSRF en webhooks, límites de tasa, secretos en logs.

ENTREGABLE: docs/INFORME_CODEX.md con
1. Resumen de 10 líneas: lo más grave primero.
2. Tabla de hallazgos: id, gravedad (crítica/alta/media/baja), qué pasa, cómo reproducirlo, archivo:línea, arreglo propuesto, esfuerzo (horas).
3. Tabla de afirmaciones de la web y su estado real (Paso 2).
4. Resultado del recálculo de precios y de la comparación con competidores (Pasos 3).
5. Hallazgos de Whop y diseño de integración propuesto (Paso 4).
6. Tabla de licencias por motor (Paso 5).
7. Lista ordenada de lo que haría primero, y lo que necesita una decisión mía.
No inventes datos. Si algo no se pudo verificar, va en una sección "Sin verificar".
```
