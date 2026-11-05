# PRODUCT3D STUDIO
## Informe maestro de producto, arquitectura, selección multimodelo y economía unitaria

**Versión:** 1.0 · **Fecha de referencia:** noviembre de 2026  
**Destinatario:** desarrollador principal / agente de programación  
**Estado:** especificación de objetivo, NO certificación de funcionalidad existente  
**Documento fuente facilitado:** [Catálogo de modelos de generación 3D (Google Docs)](https://docs.google.com/document/d/1XvUK3qa2vc7QOH8sJj1zQCTy-D4dy7AtYDgowF531AY/edit)

> **DIRECTIVA DE ALCANCE.** No diseñar ni implementar landing page ni acciones de marketing. No diseñar, estimar ni construir generador de videos en esta fase. La idea de video queda congelada para una posible fase posterior **solo si hay demanda y disposición de pago validadas**. No crear pantallas decorativas para funciones sin integración real. Trabajar sobre el código existente; no rehacer el MVP sin necesidad.

---

# 1. Encargo ejecutivo: qué debe ser el producto terminado

Product3D debe ser una **plataforma multimodelo de generación y gestión de activos 3D**, comparable en facilidad de descubrimiento a Higgsfield y orientada a flujos profesionales de Hyper3D, pero con identidad y experiencia propias. Un usuario crea un modelo desde texto, una imagen o varias vistas; lo inspecciona, mejora, guarda, exporta y lleva a su entorno de trabajo. La app debe resolver tanto tareas de **e-commerce** como de **desarrollo de videojuegos** y **creación 3D profesional**, sin convertirse en tres productos duplicados.

## 1.1 Principios no negociables

1. **Una sola aplicación y un solo backend.** Personalizar presentación, no permisos artificiales ni duplicar lógica.
2. **Motor multimodelo real.** Poder alternar entre proveedores/versiones mediante configuración, no condicionales dispersos por la UI.
3. **Operaciones transparentes.** Antes de ejecutar: modelo, capacidades, formatos, costo en ProductCredits, alternativas y estimación de tiempo cuando exista una medición propia.
4. **Sin falsa promesa de fidelidad.** Una malla generada puede inventar superficies ocultas, geometría, logos, tejidos y medidas; informar y permitir inspección.
5. **Reproducibilidad y trazabilidad.** Guardar proveedor, ID del modelo, versión, parámetros, input, costos, tiempos, estado y versiones de artefactos.
6. **Finanzas verificables.** Cada trabajo queda contabilizado en dólares reales de costo y créditos internos. No fijar precios por intuición ni trasladar literalmente los créditos del proveedor.
7. **Integraciones reales, con publicación consciente.** Shopify primero; web embed, Blender, WooCommerce, Unity/Unreal y MCP según fases y validación.
8. **Seguridad y aislamiento multiusuario.** Las imágenes de productos, archivos 3D y credenciales de tiendas son privados por defecto.
9. **Arquitectura reemplazable.** La salida de un proveedor o cambio de tarifa no debe romper generaciones históricas.
10. **Costo controlado por diseño.** Sin tareas infinitas, retries indiscriminados, créditos negativos ni APIs externas llamadas desde el navegador.

## 1.2 Qué NO es Product3D

- No es un editor de Blender completo dentro del navegador.
- No es una promesa de reconstrucción metrológica exacta desde fotografías.
- No es un software CAD paramétrico que garantiza dimensiones, ensamblaje o manufactura.
- No es una API ilimitada de modelos a precio fijo.
- No es, por ahora, una herramienta de animación o generación de videos.

## 1.3 Definición de éxito

Un usuario nuevo puede registrarse, elegir perfil, entender el costo, generar, ver, inspeccionar, descargar un GLB válido y volver a abrir el mismo asset. Para comercio, puede conectar una tienda de pruebas y publicar un archivo 3D a un producto seleccionándolo conscientemente. Para perfil técnico, puede acceder a parámetros compatibles y a una API documentada. Cada operación repercute correctamente en el historial de créditos y en los costos registrados.

---

# 2. Perfiles, onboarding y dashboard adaptable

## 2.1 Preguntas iniciales (máximo 3, todas editables)

**P1. Uso principal:** a) E-commerce / tienda online; b) Game development; c) Diseñador / artista 3D; d) Exploración / otro.  
**P2. Nivel de experiencia:** a) Principiante; b) Intermedio; c) Avanzado.  
**P3. Objetivo inmediato:** a) Convertir fotos a 3D; b) Crear desde texto; c) Preparar assets para mi software; d) Publicar en una tienda. La tercera pregunta cambia sus opciones según P1.

Permitir **Omitir por ahora**. Guardar como preferencias editables. Si hay varias categorías de uso, permitir cambiar de espacio con un selector rápido. No ocultar nunca el catálogo ni los motores: solo cambiar los accesos destacados, nomenclatura, tutoriales, recomendaciones, presets y la profundidad de la interfaz.

## 2.2 Distribución según perfil

| Perfil | Pantalla principal | Acciones destacadas | Preset sugerido | Controles iniciales |
|---|---|---|---|---|
| Commerce | Proyectos de producto y ejemplos verificados | Foto(s) → 3D; publicar; visor web | Fidelidad visual / calidad equilibrada | Modo guiado, costo total visible |
| Game developer | Biblioteca de assets / escenarios | Texto→3D; geometría; LOD/optimización; exportar | Game / geometría editable | Triángulos, texturas, pivote, formatos |
| Pro / artista | Explorador de modelos y herramientas | Comparar motores; parámetros; versiones; exportaciones | Selección manual | Menús avanzados abiertos |
| Explorador | Galería de ejemplos reales | Probar una imagen o prompt | Fast y bajo costo | Asistente de primer uso |

### Ejemplos de galería

Mostrar 12–18 ejemplos **generados y conservados por Product3D**: mueble rígido, lámpara, decoración, auriculares, mochila simple, prop low-poly, objeto estilizado, objeto mecánico, etc. Cada ejemplo debe tener miniatura, modelo 3D navegable, proveedor, calidad/preset, inputs permitidos para publicación, fecha, formato y botón **Usar esta configuración**. No usar renders sintéticos como prueba de capacidades que el motor no tiene.

## 2.3 Comportamiento de adaptación

- `preferred_use_case` y `experience_level` en perfil; `active_workspace` en estado de UI.
- Cards y orden filtrados por ranking, pero todas las herramientas accesibles en `Explore all`.
- Las recomendaciones vienen de reglas versionadas, no de afirmaciones vagas de IA.
- En modo guiado: presets simples y vista previa del costo; en avanzado: parámetros por proveedor con documentación contextual.
- Persistencia entre sesiones y dispositivos; nunca resetear preferencias tras una actualización.
- Accesibilidad: teclado, estados de foco, alternativas textuales a previews y mensajes de errores comprensibles.

## 2.4 Criterios de aceptación

- [ ] Onboarding se puede completar u omitir, guardar y editar.
- [ ] Perfiles cambian prioridades y textos sin modificar el acceso real a features contratadas.
- [ ] La elección de perfil no afecta la contabilidad de créditos.
- [ ] Galería carga únicamente assets de demostración publicados y comprobados.
- [ ] Los resultados de ejemplo pueden abrirse en visor GLB y muestran parámetros de producción reales.

---

# 3. Workflows de generación: experiencia de uso completa

## 3.1 Crear proyecto y elegir modo

1. Crear proyecto con nombre, categoría, uso principal, etiquetas y unidad física opcional.
2. Elegir `Text to 3D`, `Image to 3D` o `Multi-view to 3D`.
3. Cargar texto/imágenes: revisar tamaño, tipo, orientación, consentimiento y límites del motor.
4. Elegir perfil comercial `Fast / Studio / Game / Advanced` o modelo manual.
5. Ver **cotización exacta de créditos** para opciones activas; mostrar precio de addons antes de confirmar.
6. Confirmar; crear trabajo asíncrono; registrar reserva de créditos.
7. Mostrar cola, estado, progreso verificable, cancelación cuando sea técnicamente posible y estimación basada en datos, no inventada.
8. Guardar salida en almacenamiento propio; construir miniatura segura; calcular métricas de malla; actualizar estado.
9. Inspeccionar, comparar versiones y descargar solo formatos realmente generados o convertidos.
10. Exportar a integración o compartir enlace/embed si el usuario habilita publicación.

## 3.2 Text to 3D

Formulario: prompt; categoría; estilo; uso; nivel de detalle; material opcional; parámetros avanzados compatibles. Mostrar alerta cuando el proveedor realmente convierte primero texto→imagen: eso debe figurar como pipeline, no como un endpoint nativo si no lo es. Capturar idioma y normalización de prompt sin traducir instrucciones técnicas incorrectamente.

## 3.3 Image to 3D

Imágenes JPG/PNG/WebP compatibles, vista previa, eliminación de fondo opcional si proveedor aprobado, validación de una sola pieza y advertencia sobre superficies invisibles. No prometer fidelidad de marca, logotipo, estampados ni medidas sin verificación. Registrar hash de input y asociación con proyecto.

## 3.4 Multi-view to 3D

Subida etiquetada `frente`, `atrás`, `izquierda`, `derecha`, `arriba`, `abajo` y perspectivas diagonales. Validar cuántas imágenes permite **cada endpoint**, no declarar un límite global. Guías de consistencia: mismo objeto, iluminación similar, sin cambiar su forma, preferentemente fondo simple. Manejar límites distintos como Rodin 2.5 (hasta 5 imágenes) y Hunyuan Pro (hasta 8 según endpoint). Degradar elegantemente si el motor elegido no soporta multi-vista; sugerir otro antes de cobrar.

## 3.5 Presets y selección automática

`Fast`: minimizar costo/latencia; `Studio`: priorizar fidelidad visual/PBR; `Game`: priorizar malla utilizable y exportación; `Advanced`: modelo explícito con todos los controles que admita. Los presets son **perfiles de producto**, no nombres falsos de modelos. La decisión del router depende de capacidad, calidad empírica, ratio de aceptación, costo efectivo, latencia y habilitación/licencia.

`candidate_score = w1 * fidelity + w2 * usable_mesh + w3 * uptime - w4 * normalized_cost - w5 * latency` con pesos por perfil. Nunca puntuar sin benchmarks propios. Ofrecer *recomendado*, *económico* y *control total* si hay evidencia suficiente. Permitir fallback **solo con consentimiento de cambio de proveedor o dentro del preset preautorizado**, manteniendo precio y licencia claras.

## 3.6 Estados de trabajo (máquina de estados)

`draft → quoted → reserved → queued → running → processing → succeeded | failed | cancelled | timed_out | needs_review`.

- Una ejecución de proveedor por `idempotency_key`; callbacks duplicados no duplican cargos.
- La reserva no equivale a consumo definitivo.
- Tiempo máximo de trabajo configurable por modelo. Reintentos técnicos acotados y registrados.
- Si el proveedor devuelve URL temporal, descargar y verificar de inmediato al bucket propio, con autorización y control de redirecciones.
- Si falla la generación y ya se cobró al proveedor, registrar costo externo y aplicar **política transparente de crédito al cliente** sin mentir sobre reembolso del proveedor.
- Si el usuario cancela cuando el proveedor ya inició, especificar política antes de la confirmación.

---

# 4. Biblioteca y herramientas 3D: entregables que deben funcionar

## 4.1 Biblioteca de assets

Proyectos y versiones; búsqueda por nombre, etiquetas, categoría, proveedor y fecha; filtros por formato, estado, privacidad; thumbnails; duplicación de configuración; favoritos; carpetas opcionales; papelera con retención; limpieza de archivos derivativos de acuerdo con políticas; uso y costos detallados. Evitar descargas públicas de archivos originales por defecto.

## 4.2 Visor 3D

GLB/glTF como estándar de vista web. Orbit, zoom, pan, reset, fondo, iluminación, carga progresiva, indicación de escala, wireframe si el visor lo permite, contador de triángulos, materiales/texturas, tamaño total del archivo y advertencias de optimización. GLB con texturas de terceros debe validarse; no ejecutar scripts ni interpretar formatos no seguros.

## 4.3 Diagnóstico de assets

`geometry_metrics`: vértices, triángulos, submeshes, bounding box, presencia de materiales y texturas, resolución de texturas, volumen/tamaño de disco, coordenadas UV, normals, pivote, unidades/escala y problemas detectados. La etiqueta "Game-ready" solo se muestra tras pasar controles **de un preset técnico explícito**; no equivale a certificación universal para Unity/Unreal.

## 4.4 Postprocesamiento

- Conversión GLB → USDZ/FBX/OBJ/STL cuando exista pipeline probado con pruebas de materiales y escala.
- Reducción de polígonos con calidad evaluada y métricas antes/después.
- Reorientación, pivote, escala, compresión de texturas, remesh/retexture y UV si el proveedor o toolchain lo soporta.
- Cada transformación crea nueva `asset_version`; preservar siempre el original.
- No prometer malla manifold, quad topology o impresión 3D sin pasar validaciones y sin que el endpoint la proporcione.

## 4.5 Publicación del asset

Tres destinos: descarga privada, enlace de vista explícitamente compartido y embed web. Proveer un snippet seguro para visor `<model-viewer>` o equivalente, con dominio/visibilidad configurables, CDN, políticas CORS adecuadas, carga perezosa y revocación. No incluir código remoto del usuario sin sandbox.

---

# 5. Integraciones: prioridades, contratos y seguridad

## 5.1 Shopify — primera integración comercial

**Objetivo:** un comerciante autentica su tienda, selecciona producto existente, revisa preview, formato, escala, peso y confirma publicar un modelo 3D. Usar Shopify GraphQL Admin API vigente, scopes mínimos (`read_products`, `write_products`, `write_files` según flujo). Realizar carga segura mediante `stagedUploadsCreate`/`fileCreate` y asociar archivo al producto con el mecanismo vigente (`productUpdate` o `productSet`, evitando `productCreateMedia` por deprecación). Esperar procesamiento asíncrono y verificar estado final. Manejar errores de permisos, límites, producto eliminado, formato inválido y desconexión OAuth. Nunca publicar automáticamente tras generar sin aprobación del usuario. Probar con tienda de desarrollo.

**Restricción de UX:** si el producto usa una plantilla de Shopify que no muestra modelos interactivos, informar que la visibilidad depende del tema y configuración; no prometer mostrarlo sin comprobarlo.

## 5.2 WooCommerce — segunda integración de comercio

Plugin WordPress propio o integración autorizada con REST API; asociar asset a producto mediante metadatos/funcionalidad del plugin y renderizar con visor propio o `<model-viewer>`. No asumir soporte nativo equivalente a Shopify. OAuth/API keys con mínimo privilegio, firma de webhooks si aplica, sanitización HTML y defensas CSRF/XSS, soporte de desinstalación y revocación. Debe funcionar con pruebas end-to-end en WooCommerce de laboratorio.

## 5.3 Blender — primera integración profesional

Complemento Blender en Python con login por token de corta vida o device flow, catálogo, generación, polling, descarga y *append/import*. Debe respetar unidades, materiales y ejes; mostrar malla en escena sin bloquear UI; no guardar claves API generales dentro del addon. Puede reutilizar API pública. Registrar licencia y atribuciones del asset cuando se exija.

## 5.4 Unity / Unreal — después de validación

Editor package/plugins con generación y descarga del artefacto, importación y asignación de materiales compatibles; Unity prefab opcional; Unreal importador/asset content pipeline; no automatizar publicación ni asumir que un GLB equivale a asset de producción. Tests mínimos en versiones soportadas.

## 5.5 API pública y MCP

Diseñar API primero (`/v1`), con recursos `/models`, `/quotes`, `/jobs`, `/assets`, `/exports`, `/credits`, `/integrations`; tokens scopes limitados, rate limiting y webhooks firmados. En servidor MCP implementar herramientas `list_models`, `quote_generation`, `create_generation`, `get_generation`, `list_assets`, `export_asset`, `get_credit_balance`. `publish_to_shopify` solo con confirmación explícita y autorización del comercio. Evitar que una llamada a la herramienta MCP incremente una suscripción o compre créditos sin aprobación. Se soportarán clientes MCP compatibles, no prometer compatibilidad validada de todos sin pruebas.

## 5.6 Secuencia de entrega de integraciones

1. Embed web + exportación GLB estable (base).
2. Shopify en tienda de desarrollo.
3. Blender + API pública y MCP (en paralelo si hay recursos).
4. WooCommerce.
5. Unity y Unreal según demanda real y capacidad de mantenimiento.

---

# 6. Arquitectura técnica y datos

**Implementar de acuerdo con el repositorio existente.** El siguiente stack es un diseño de referencia, no una orden de migrar: Next.js + TypeScript; servicios backend seguros; PostgreSQL/Supabase con RLS si ya existe; almacenamiento privado S3/R2/Supabase Storage; worker/cola persistente para trabajos largos; API provider adapters; monitorización; proveedor de cobro permitido y disponible legalmente. No usar una función de request de servidor de corta vida para procesar tareas 3D de varios minutos.

## 6.1 Servicios

- **Identity & Workspaces:** cuentas, equipos, roles, sesiones, preferencias.
- **Model Registry:** catálogo versionado de `providers`, `model_versions`, `capability_matrix`, estado y fuentes de precios.
- **Quote & Credit Ledger:** cotización server-side; reserva/captura/reversa; créditos mensuales y comprados.
- **Generation Orchestrator:** jobs, colas, idempotencia, webhooks, timeouts, retries.
- **Provider Adapters:** autenticación, schema de input/output, traducción de parámetros, reconciliation.
- **Asset Pipeline:** ingestión, antivirus/validación, conversión, miniatura, almacenamiento privado, retención.
- **Integration Gateway:** tokens cifrados y conexiones Shopify/Woo/Blender/etc.
- **Admin & Observability:** uso, costos, errores, drift tarifario, cancelaciones, métricas de calidad.

## 6.2 Esquema sugerido (tablas / entidades)

| Entidad | Campos clave / reglas |
|---|---|
| `users`, `organizations`, `memberships` | `org_id`, roles, aislamiento, perfil de onboarding |
| `projects` | `id, org_id, owner_id, name, category, visibility, created_at` |
| `assets` | `id, project_id, canonical_version_id, status, permissions` |
| `asset_versions` | `id, asset_id, generation_job_id, source_version_id, storage_key, mime, sha256, bytes, triangles, texture_meta, generation_params` |
| `providers` | `slug, legal_name, enabled, terms_url, price_source_url, last_verified_at` |
| `model_versions` | `provider_id, slug, version, external_endpoint, capability_json, lifecycle_state, cost_rule_version` |
| `generation_jobs` | `org_id, model_version_id, type, input_keys, params, provider_request_id, state, idempotency_key, quote_id` |
| `job_events` | línea de tiempo inmutable de estados, errores y reintentos |
| `credit_wallets` | saldo mensual y saldo adicional separados; nunca saldo negativo |
| `credit_ledger` | movimientos inmutables `grant/reserve/capture/reverse/expire/adjust` con `job_id` y unique constraints |
| `provider_cost_events` | USD, moneda, comisión, consumos reales, price_version, proveedor y tipo de tarea |
| `subscription_plans`, `plan_versions` | beneficios versionados y precio configurado, vigencia y Stripe/provider ID si aplica |
| `integrations` | tipo, org_id, scopes, secrets cifrados, token expiry, estados |
| `publication_jobs` | destino, asset_version_id, producto ID, aprobación humana, resultado remoto |
| `api_tokens`, `audit_logs` | scopes, hash del token, fecha, actor, IP abreviada cuando corresponda |

Todos los recursos deben tener propiedad verificable y RLS/autorización en cada query; las reglas se comprueban por *org_id* y membresía activa. Secrets nunca en cliente ni registros. Soft deletion + retención configurable. PostgreSQL constraints para evitar cobrar dos veces el mismo `job_id`.

## 6.3 Contrato de adapter

```
interface ModelAdapter {
  getCapabilities(): CapabilityMatrix
  validateInput(input: GenerationInput): ValidationResult
  estimateCost(input: GenerationInput, priceVersion: string): CostEstimate
  submit(input: GenerationInput, idempotencyKey: string): ProviderSubmission
  getStatus(providerRequestId: string): ProviderStatus
  fetchResult(providerRequestId: string): AssetManifest
  cancel?(providerRequestId: string): CancelResult
  reconcileBilling?(providerRequestId: string): ProviderCostEvent
}
```

La `CostEstimate` puede ser rango cuando el proveedor cobra por duración, cómputo o resolución. Si el precio no puede conocerse con suficiente certeza, ofrecer límite máximo preautorizado; cobrar con ajuste/reversión en ledger. Registrar versión del adapter y del schema. No enviar `provider_url` suministrada por el usuario sin validación SSRF.

## 6.4 API interna y pública (propuesta)

- `GET /v1/models?mode=image-to-3d` lista habilitados con capacidades **y timestamp de precio verificado**.
- `POST /v1/quotes` valida input y devuelve `quote_id`, crédito total, addons, expiración, modelo y términos.
- `POST /v1/jobs` requiere quote vigente, idempotency key, ownership, crédito suficiente; responde `202` con job.
- `GET /v1/jobs/{id}` estado normalizado.
- `GET /v1/assets/{id}` metadata y versiones, sin URL permanente pública.
- `POST /v1/assets/{id}/exports` prepara conversión y enlace temporal.
- `POST /v1/integrations/shopify/publish` requiere token de tienda y confirmación explícita de asset/producto.
- `GET /v1/billing/usage` saldo, consumos, reservas y costos explicados.

---

# 7. Sistema económico: créditos, planes y ganancias unitarias

## 7.1 Dos monedas que NO deben confundirse

- **ProveedorCredit:** crédito o unidad de facturación comprada al proveedor; Meshy y Tripo tienen unidades distintas. A veces una factura combina generaciones, textura y suplementos. No trasladar esos números directamente.
- **ProductCredit:** unidad interna que compra el usuario; estable, transparente, con precio mostrado antes de ejecutar.

**Propuesta inicial para simulación:** 1 ProductCredit representa **US$0,02 de presupuesto de costo variable cubierto**; esto no es dinero canjeable, ni tipo de cambio universal, ni tarifa de proveedor. El backend calcula `credits = ceil(C_effective_usd / 0.02)` donde `C_effective` ya incluye seguridad, retries, procesamiento y costos directos. El precio comercial de los planes debe dejar margen suficiente; si la fórmula requiere demasiados créditos, se revisa el producto, no se oculta costo.

## 7.2 Cálculo por job

```
C_provider = (unidades_de_proveedor × USD_por_unidad) + addons + fee_especial
C_retry = C_provider × retry_rate_estimado  [solo si realmente se factura el reintento]
C_post = conversion + textura + storage_variable + CDN_variable + egress
C_effective = C_provider + C_retry + C_post + risk_buffer
ProductCredits = ceil(C_effective / 0.02)
```

`risk_buffer` parametrizable por modelo y validado con datos; no usar una tasa igual para todos si las fallas difieren. El **precio de generación puede actualizarse prospectivamente** y debe conservar un historial de versiones; quote expira y debe volver a calcularse si cambian condiciones.

## 7.3 Planes únicamente como hipótesis para probar cálculos

| Plan piloto | Precio USD/mes | ProductCredits/mes | Máximo presupuesto variable teórico* | Público |
|---|---:|---:|---:|---|
| Starter | 19 | 150 | $3,00 | Uso ocasional |
| Creator | 49 | 500 | $10,00 | Freelancers |
| Commerce | 99 | 1.100 | $22,00 | E-commerce recurrente |
| Studio/API | 199 | 2.400 | $48,00 | Profesionales y equipos |

*Es el límite teórico de costo asignado por equivalencia de créditos y no incluye todos los costos fijos, comisiones ni pérdidas operativas no imputadas. **No lanzar estas cuotas como precios finales sin backtesting y revisión de valor percibido.**

La suscripción puede permitir módulos y créditos configurables, pero hay que evitar combinaciones de planes infinitas: plan base + uno de 3–5 paquetes adicionales predefinidos + packs de uso no recurrentes. Precio final, impuestos, políticas de expiración, renovación, límites, cancelación y costo de sobregiro deben ser claros antes de pagar.

## 7.4 Calculadora que verá el usuario

Para cada motor habilitado, mostrar: precio **en ProductCredits** de una generación con el preset actual; costo de addons; **generaciones máximas teóricas por plan** `floor(available_credits / price_per_generation)`; y aviso de que son estimaciones si se mezclan tipos de trabajo o hay reintentos facturables. Si no hay un precio exacto verificable, ofrecer "cotizar" y tope previo, no una cantidad falsa.

## 7.5 Análisis financiero que debe producir el coder

Para CADA modelo/preset: proveedor y endpoint, USD por llamada, textura/PBR, multivista, conversión, retry medido, tasa de error, costo total esperado, ProductCredits cargados, ingreso efectivo por crédito según plan, margen bruto por tipo de usuario y escenario de utilización (25/50/75/100%). Reportar también: comisión de cobro, impuestos por régimen, almacenamiento, egress, soporte, infraestructura, devoluciones y CAC separado si se calcula más adelante. Escenarios de usuarios que gastan casi todos los créditos, especialmente en el motor más caro. **Nunca afirmar ganancias netas a partir de precio menos API sin otros gastos.**

```
MRR = SUM(active_subscriptions × price) + average_monthly_extra_credit_sales
COGS = provider_costs + job_processing + storage_egress + usage_based_fees
Gross_Profit = MRR - COGS
Contribution_Profit = Gross_Profit - payment_fees - support_variable - refunds
Operating_Profit = Contribution_Profit - fixed_costs - other_overhead
Gross_Margin = Gross_Profit / MRR
```

En cohortes anuales, usar ingresos reconocidos mensualmente y no confundir cobro anticipado con MRR. Probar 0, 10, 30, 100, 300 y 1.000 clientes, mezcla realista de planes, churn, costo por trabajo, uso p95, incidencias y precio de APIs cambiado +50%. Establecer umbrales de alerta cuando margen variable cae debajo de objetivo (por ejemplo 65% piloto) o costo externo excede reserva.

## 7.6 Ejemplo auditado: precio por generación

Supuesto hipotético: proveedor $0,40, reintentos que agregan $0,08 en promedio, conversión/almacenamiento $0,07 y buffer $0,05. Costo esperado = **$0,60**. A $0,02 de presupuesto por crédito, cobrar **30 ProductCredits**. Con 500 créditos del plan Creator se podrían generar **16 modelos** del mismo tipo, si no consume nada más. La API puede costar menos o más en producción: este ejemplo NO es una cotización real ni una recomendación final de precio.

## 7.7 Ledger y cobros: invariantes

- Reserva atómica para impedir doble gasto y carreras simultáneas.
- Captura exacta una vez; reversión exacta una vez; reconciliación con consumo real.
- Créditos mensuales y packs con política explícita de expiración/fuente.
- Planes cambiados generan prorrateos y uso correcto de saldos, sin doble grant.
- Frontend nunca es fuente de verdad de saldos.
- Si proveedor deja de funcionar, deshabilitar modelo rápidamente; no ocultar fallos ni cargar costo a usuarios sin entregar lo acordado.
- No permitir generar si no se verificó derecho comercial del proveedor.

---

# 8. Seguridad, calidad, operación y pruebas

## 8.1 Seguridad de datos

Secrets en servidor y almacenamiento cifrado; tokens de Shopify con scopes mínimos; uploads con URLs firmadas de corta duración; límites de tamaño, tipo real, antivirus y anti-zip-bomb; sanitizar metadatos; prevenir SSRF al descargar outputs remotos; política de retención; consentimiento para utilizar inputs en proveedores; política de uso comercial y de entrenamiento de terceros; eliminación y exportación de datos.

## 8.2 Benchmark objetivo de modelos

Reunir dataset de **al menos 30 inputs autorizados**: 12 objetos de comercio rígidos (frente/múltiples vistas), 8 props de videojuegos, 5 objetos estilizados y 5 casos complicados. Generar mismo input con cada candidato y evaluar: fidelidad percibida con revisión ciega, silueta, texturas/logos, caras ocultas, artefactos, tamaño GLB, triángulos, UV, PBR, escala, tiempos, fallos, retries, costo total y licencias. Registrar score humano 1–5 y tasa de assets realmente utilizables por segmento. No usar fotografías confidenciales de una tienda en proveedores no autorizados.

## 8.3 SLO piloto (metas de ingeniería, no garantías)

- 100% de trabajos con historial completo, o error registrado.
- 0 cobros de créditos duplicados en tests de concurrencia/idempotencia.
- 100% de assets publicados vinculados a un usuario/proyecto correcto.
- Reconciliación diaria de diferencias entre proveedor, ledger y factura.
- p95 de latencia por proveedor medido y monitorizado, no inventado.
- Tasa de fallos, utilizabilidad y margen separados por versión y modo.

## 8.4 Pruebas obligatorias

Unit tests del estimador de precios, estado de job, normalización de salida, conversión de archivos, lógica de recomendaciones; integration tests con respuestas mock de proveedores; E2E con 1–3 proveedores reales en sandbox y un gasto máximo explícito; pruebas RLS multi-tenant, archivo cruzado, webhook repetido, cancelación y retry. E2E de Shopify en tienda de desarrollo y prueba Blender addon en una versión estable. Auditar que API y MCP respeten idénticos límites de créditos que la web.

---

# 9. CATÁLOGO AMPLIO DE APIS Y MODELOS A EVALUAR — PÁGINA INDEPENDIENTE

> **Instrucción obligatoria al coder:** esta sección transcribe y amplía las opciones del Google Doc suministrado. No representa una lista de APIs disponibles/aptas comercialmente en todos los casos. Distinguir **contrastado contra página oficial** frente a **mencionado en documento, pendiente de verificar**. Los importes son referencias fechadas, no contratos ni presupuestos definitivos. El fichero `CATALOGO_APIS_3D.csv` contiene estas filas editables.

## 9.1 Directorio de modelos por familia

| Familia | Modelo / versión | Capacidades declaradas | Endpoint o vía | Precio/costo de referencia | Estado |
|---|---|---|---|---|---|
| Hyper3D Rodin | Rodin Gen-1.5 | texto; imagen | Hyper3D API / fal.ai | Documento: US$0.20–0.40 | Documento/no verificado |
| Hyper3D Rodin | Rodin Gen-2 | texto; imagen; multivista declarada en doc | fal-ai/hyper3d/rodin/v2 | Confirmado: US$0.40/solicitud | API y precio contrastados |
| Hyper3D Rodin | Rodin Gen-2.5 Fast | imagen | fal-ai/hyper3d/rodin/v2.5/fast | Confirmado: US$0.10/solicitud | API y precio contrastados |
| Hyper3D Rodin | Rodin Gen-2.5 Standard | texto; imagen; hasta 5 fotos (imagen) | fal-ai/hyper3d/rodin/v2.5 | Confirmado: US$0.40 base; +US$0.80 HighPack | API y precio contrastados |
| Tripo | TripoSR | imagen | Replicate / fal.ai alternativo | Documento: US$0.01–0.02 | Documento/no verificado |
| Tripo | Tripo v1.4 / v2.0 | texto; imagen | Tripo OpenAPI | Documento: US$0.10–0.20 | Legacy; no priorizar |
| Tripo | Tripo v2.5 | texto; imagen; multivista | Tripo OpenAPI / fal.ai | Documento: US$0.20–0.45 | Verificar endpoint y versión |
| Tripo | Tripo v3.0 Ultra | texto; imagen; multivista | Tripo API | Documento: variable | Documento/no verificado |
| Tripo | Tripo H3.1 | texto; imagen; multivista | tripo3d/h3.1/* | Confirmado en fal: US$0.20 malla; $0.30 textura; $0.40 HD; addons | API y precio contrastados |
| Tripo | Tripo P1/P1.0 | low-poly; texto; imagen | Tripo OpenAPI | Según docs actuales P1: base 30–50 Tripo créditos, según tarea | API oficial identificada, versión verificar |
| Hunyuan3D | Hunyuan3D 1.0 | texto; imagen | Replicate/Hugging Face | Documento: US$0.05 | Documento/no verificado |
| Hunyuan3D | Hunyuan3D 2.0 | imagen; multivista | Replicate / open weights | Documento: US$0.07–0.10 | Documento/no verificado |
| Hunyuan3D | Hunyuan3D 2.1 | imagen; multivista | Replicate / open weights | Documento: US$0.07–0.10 | Documento/no verificado |
| Hunyuan3D | Hunyuan3D 2.5 | texto; imagen | Tencent / fal.ai | Documento: US$0.15–0.20 | Documento/no verificado |
| Hunyuan3D | Hunyuan3D v3.1 Rapid | texto; imagen | fal-ai/hunyuan-3d/v3.1/rapid/* | Confirmado: US$0.225 base; +US$0.15 PBR | API y precio contrastados |
| Hunyuan3D | Hunyuan3D v3.1 Pro | texto; imagen; multivista hasta 8 | fal-ai/hunyuan-3d/v3.1/pro/* | Confirmado: US$0.375 base; +0.15 PBR; +0.15 multivista | API y precio contrastados |
| TRELLIS | TRELLIS 1 | imagen | fal-ai/trellis | Confirmado: US$0.02/solicitud | API y precio contrastados |
| TRELLIS | TRELLIS.2 | imagen | fal-ai/trellis-2 | Confirmado: US$0.25 512p; 0.30 1024p; 0.35 1536p | API y precio contrastados |
| TRELLIS | TRELLIS.2 Retexture | retexturizar 3D | fal-ai/trellis-2/retexture | Documento: US$0.20–0.24 | Documento/no verificado |
| Meshy | Meshy-4 | texto; imagen | Meshy API | Documento: precios antiguos | Legacy: no habilitar sin confirmación |
| Meshy | Meshy-5 | texto; imagen | Meshy API | Retirado según documentación 2026 | Retirado / bloquear nuevas llamadas |
| Meshy | Meshy-6 | texto; imagen | Meshy API / fal-ai/meshy/v6-preview/image-to-3d | API Meshy: 20 créditos malla / 30 con textura; fal: US$0.80 preview | API y tarifas por canal contrastadas |
| Meshy | Meshy-7 | texto; imagen; multivista | Meshy API / fal.ai | API Meshy: 20 créditos malla / 30 con textura / 35 con 8K + extras | API y créditos contrastados |
| Meshy | Meshy-7.1 | texto; imagen; multivista | Meshy API | API Meshy: según modo 20–35 créditos + resolución | API identificada: confirmar plan y disponibilidad |
| Meshy | Meshy T2 Smart Topology | postprocesamiento de malla | Meshy API | Confirmado: 5 Meshy créditos | API y tarifa en créditos contrastadas |
| Stability AI | Stable Fast 3D | imagen | Stability AI API | Confirmado: 10 Stability credits | API y tarifa en créditos contrastadas |
| Stability AI | SPAR3D | imagen; edición por puntos | Stability AI API | Confirmado: 4 Stability credits | API y tarifa en créditos contrastadas |
| Stability AI | SV3D / Stable Zero123 | vistas orbitales 3D | Stability AI / Replicate | Documento: US$0.02–0.04 | Investigación / legado |
| Hi3D | Hi3D v2.1 / legacy | imagen | hitem3d/hi3d/image-to-3d | fal: variables por resolución US$0.30–0.90 | API y tarifa por variante contrastadas |
| Hi3D | Hi3D v3.0 | imagen | hitem3d/hi3d/v3.0/image-to-3d | Precio dinámico por geometría+textura+PBR; verificar quote | API oficial identificada, costo por config pendiente |
| CSM | CSM Cube 1.5 / 2.0 | imagen; texto; escenas | CSM API | Documento: US$0.20–0.50 | Documento/no verificado |
| CraftsMan | CraftsMan 1.5 | imagen; texto | open source/hosting propio | Documento: costo GPU US$0.04–0.08 | Investigación / modelo abierto |
| Sloyd | Sloyd AI v3 | paramétrico; texto; imagen | Sloyd API | Documento: US$0.10–0.83 | Documento/no verificado |
| Luma | Luma Genie 1.0 | texto; imagen | Web / API socios no confirmada | Documento: US$0.10–0.25 estimado | Disponibilidad pública no comprobada |
| Pixal | Pixal3D | imagen | fal.ai (pendiente localizar) | Documento: US$0.30–0.42 | Documento/no verificado |
| Meta | SAM 3 3D Objects | segmentación; extracción | fal-ai/sam-3/3d-objects | Confirmado en fal pricing: US$0.02 por unidad, cotizar tarea | API identificada, no equivale a generación completa |
| InstantMesh | InstantMesh | imagen | Replicate/open source | Documento: US$0.03–0.05 | Investigación/open-source |
| LGM | Large Gaussian Model | imagen; texto; gaussian splatting | Replicate/open source | Documento: US$0.02–0.04 | No equivalente a malla GLB utilizable |
| Wonder3D | Wonder3D | imagen; normal maps | Replicate/open source | Documento: US$0.05–0.09 | Investigación/open-source |
| Unique3D | Unique3D | imagen; malla | Open source/Replicate | Documento: costo variable | Investigación/open-source |
| MVDream | MVDream | texto; vistas múltiples | Replicate / abierto | Documento: US$0.06–0.12 | Investigación, genera vistas/pipeline |
| ImageDream | ImageDream | imagen; vistas múltiples | Replicate / abierto | Documento: US$0.06–0.12 | Investigación, genera vistas/pipeline |
| OpenAI | Shap-E | texto; imagen | open source/Replicate | Documento: <US$0.01 | Legacy/investigación, calidad desactualizada |
| OpenAI | Point-E | texto; puntos 3D | open source | Documento: <US$0.01 | Legacy/investigación |
| Google | Gemini 1.5 Flash / Pro | código procedural, no 3D mesh nativo | Gemini API / Vertex legacy | Costo tokens: verificar | No es generador 3D nativo |
| Google | Gemini 2.5 Flash / Pro | código procedural, no 3D mesh nativo | Gemini API / Vertex | Precio por tokens independiente; verificar | No es generador 3D nativo |

## 9.2 Proveedores y verificaciones concretas realizadas

- **Hyper3D Rodin**: `https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5`; fal Rodin 2.5 `$0.40` base y `+$0.80` HighPack; Fast `$0.10`, en páginas de fal revisadas.
- **Tripo**: `https://docs.tripo3d.ai/get-started/pricing.html`; el precio directo es **en Tripo API credits**, con `US$1 = 100 créditos` en esa documentación y suplementos por tareas. En fal H3.1, $0.20 sin textura, $0.30 con textura estándar y $0.40 HD, con extras. **No asumir que el costo es el mismo entre canales**.
- **Hunyuan3D v3.1**: `https://fal.ai/hunyuan-3d`; Pro `$0.375` y Rapid `$0.225`, PBR `+$0.15`; algunas opciones multi-view/postprocess suman más.
- **TRELLIS**: `https://fal.ai/models/fal-ai/trellis`; `$0.02` para TRELLIS 1. `https://fal.ai/models/fal-ai/trellis-2`; TRELLIS.2 `$0.25/$0.30/$0.35` según resolución.
- **Meshy**: `https://docs.meshy.ai/en/api/pricing`; Meshy 6/7 tienen tarifas **en créditos Meshy**. Se debe comprar API usage por separado según sus condiciones. Ver deprecaciones/versiones (`meshy-5` retirado en 2026 según documentación).
- **Stability AI**: `https://platform.stability.ai/pricing`; Stable Fast 3D aparece con 10 créditos y SPAR3D con 4 créditos del proveedor. No convertir a dólares con la tasa de otro proveedor.
- **Hi3D**: `https://fal.ai/models/hitem3d/hi3d/v3.0/image-to-3d/api`; endpoint identificado, variantes facturadas por resolución/textura/PBR.
- **Catálogo agregador**: `https://fal.ai/3d-models` y `https://fal.ai/pricing`; las unidades pueden representar generación, crédito de proveedor o unidad de cómputo: leer la ficha del endpoint.

## 9.3 Checklist de evaluación para CADA candidato, sin excepciones

1. URL de documentación actual, versión y proveedor de inferencia verificables.
2. Endpoint exacto, autenticación, limitación por cuenta, webhook/polling, idempotencia, términos y SLA.
3. Modos nativos reales: texto, imagen, multivista; cantidad, formato y tamaño de inputs.
4. Controles reales: PBR, textura 2K/4K/8K, quads/tris, poligonaje, semilla, rigging, exportaciones, formato de malla.
5. **Tarifa de proveedor por tarea y addon** en USD o con tasa de cambio del propio proveedor, fecha, redondeos y mínimos.
6. Prueba funcional: 3 inputs por perfil y costo final de la factura/dashboard.
7. Licencia para SaaS intermediario, reventa, sublicencia, uso comercial, retención de datos y entrenamiento por terceros.
8. Protección de datos y ubicación de procesamiento si afectan a clientes/comercios.
9. Historial de fallos, capacidad de soporte y mecanismo para desactivar la integración.
10. Decisión **HABILITAR / BACKLOG / DESCARTAR** con motivo técnico, económico y legal documentado.

## 9.4 Selección inicial que deberá decidir el coder

No habilitar 40 modelos porque figuren en el catálogo. Recomiendo **benchmarkear 6–8 candidatos**: un económico (TRELLIS/fast), dos equilibrados (Tripo/Hunyuan Rapid), dos alta fidelidad (Rodin 2.5/Hunyuan Pro), uno de postproceso (Meshy o equivalente) y alternativas de multi-vista. Después **habilitar en producción 3–5 endpoints** distintos como máximo si realmente aportan resultados complementarios. Publicar primero perfiles, no una lista caótica de versiones. Mantener compatibilidad para agregar motores nuevos sin redeploy de toda la aplicación.

## 9.5 Tabla obligatoria de decisión de selección

El coder entregará una tabla final por endpoint con estas columnas: `provider`, `model_version`, `endpoint`, `official_docs`, `terms_checked`, `supports_image`, `supports_multi`, `supports_text`, `tested_inputs`, `accepted_assets`, `median_latency_sec`, `p95_latency_sec`, `invoice_cost_usd`, `expected_cost_usd`, `product_credits`, `format_validation`, `commercial_use_approved`, `status`, `why`. **No rellenar números con estimaciones visuales si faltan pruebas**.

---
# 10. Roadmap por stages: orden, entregables y criterios de salida

El trabajo debe comenzar con **auditoría del código existente**. No asumir una aplicación vacía ni reimplementar lo que ya funcione. Cada stage se entrega con cambios verificables, tests y documentación de lo que falta.

## Stage 0 — Diagnóstico del repositorio y alcance del MVP actual

**Objetivo:** establecer qué existe, qué funciona y qué todavía es maqueta.

**Acciones:**

1. Revisar rutas, componentes, autenticación, base de datos, RLS, uploads, jobs, proveedor de pagos, generación y visor.
2. Trazar el camino `registro → upload → provider → resultado → GLB → descarga` y documentar dónde falla.
3. Clasificar features como `operativo`, `parcial`, `mock`, `sin implementar`, `bloqueado por API/legal`.
4. Identificar credenciales requeridas y variables de entorno **por nombre, nunca valores secretos**.
5. Revisar dependencias, licencias, storage, limitaciones en planes actuales y límites del hosting.
6. Detectar deuda de seguridad urgente antes de conectar pagos/tiendas.
7. Proponer cambios incrementales con estimación de riesgo, módulos afectados y test antes de tocar arquitectura.

**Entregables:** `AUDITORIA_ESTADO_ACTUAL.md`, diagrama del sistema, lista priorizada de gaps, plan de migraciones reversible, pruebas smoke.

**Gate:** no avanzar si no se puede ejecutar localmente y si el proveedor de generación actual no genera un activo verificable o no tiene modo mock aislado.

## Stage 1 — Núcleo funcional y modelo de datos

**Objetivo:** normalizar assets, proyectos, permisos y trabajos.

- Diseñar tablas del apartado 6 según repositorio; migraciones reversibles.
- Configurar bucket privado, URLs firmadas y manifest de asset.
- Implementar visor GLB robusto, previews, inspección y descarga.
- Generación de primer proveedor conectada de extremo a extremo; cola/worker persistente.
- Integrar idempotencia, estados, logs de job y errores traducidos a UX.
- Tests auth/RLS, carga malformada y job duplicado.

**Gate:** 10 generaciones consecutivas sin mezcla de datos entre usuarios; activos persistentes y descargables; errores reproducibles y registrados.

## Stage 2 — Registry multimodelo y router

**Objetivo:** incorporar varios proveedores sin multiplicar código.

- Registry de modelos con CRUD administrativo y flags `enabled`, `deprecated`, `pilot`, `production`.
- Implementar interfaz `ModelAdapter`, capacidades reales y mapeo de inputs/outputs.
- Integrar **2 proveedores distintos** como prueba de abstracción.
- Selección manual de modelo y presets Fast/Studio/Game; cotización distinta por modelo.
- Incorporar herramientas de comparar salidas de un mismo input.
- Reconocer add-ons de textura, PBR, multivista, quads y formatos solo si la API los acepta.
- Aislar incidentes: caída de proveedor no bloquea catálogo entero.

**Gate:** segunda integración requiere solo adapter, registro y tests; cambiar preset no introduce un endpoint incompatible ni cargos ocultos.

## Stage 3 — Onboarding, dashboard adaptativa y galería

**Objetivo:** hacer usable la potencia técnica sin imponer jerga a principiantes.

- Implementar P1/P2/P3, omitir, editar, cambio de perfil.
- Personalizar atajos, orden de herramientas, ejemplos y configuración inicial.
- Añadir galería de 12–18 ejemplos reales, reproducibles cuando licencia lo permita.
- Explicar costos, formatos y limitaciones en lenguaje apropiado al nivel de experiencia.
- No esconder funciones permitidas por plan por el perfil de onboarding.

**Gate:** test E2E para los tres perfiles; el usuario cambia perfil y mantiene proyectos, planes y saldo sin alteración.

## Stage 4 — Motor financiero: costos, ProductCredits y suscripción

**Objetivo:** cobrar sin perder trazabilidad ni margen por diseños de cuotas incorrectos.

- Integrar precios oficiales por modelo/tarea/version y política de cambios.
- Cotización server-side de job; reserva atómica; captura/reversa inmutable; idempotencia.
- Crear panel de planes parametrizables y de créditos con equivalencias por motor.
- Separar compras puntuales vs asignaciones mensuales, renovaciones, expiración y reembolso.
- Instrumentar costos por proveedor y reconciliation.
- Crear informe unit economics por plan y simulador adversarial de uso extremo.
- Definir y verificar elegibilidad legal de proveedor de pagos y datos comerciales, **sin saltar requisitos**.

**Gate:** los tests de saldo nunca dan negativo, no hay doble consumo en web/API/MCP, cotizaciones coinciden con ledgers y un cambio de tarifa puede desactivar un motor.

## Stage 5 — Procesamiento, calidad y exportación

**Objetivo:** que los modelos sean realmente utilizables.

- Métricas de malla, validaciones GLB, optimización y variantes de salida.
- Configuraciones Commerce/Web/Game con límites comprobables.
- Exportar GLB; convertir a USDZ/FBX/OBJ/STL solo tras validar materiales y escala.
- Comparación de versiones y restablecimiento de original.
- Embed web seguro y revocable con documentación técnica.
- Dataset benchmark interno y dashboard administrativa de aceptación por motor.

**Gate:** muestra de QA documentada por preset; sin modelos corruptos marcados `succeeded`; tamaño/triángulos/costos visibles al usuario.

## Stage 6 — Shopify (primera integración productiva)

**Objetivo:** entregar el flujo `Asset → publicar en producto de Shopify`.

- App Shopify OAuth con scopes mínimos; vincular tienda a organización.
- Elegir producto, vista previa, confirmación explícita, carga por API vigente, asignación y estado.
- Guardar ID remoto, token cifrado y eventos de publicación.
- Manejar revocación, errores, desinstalación y reintentos sin duplicar media.
- Documentación de temas compatibles y cómo comprobar su visualización real.

**Gate:** prueba real en tienda de desarrollo y registro correcto de estados; la desconexión impide futuras publicaciones y no elimina assets privados propios salvo decisión del usuario.

## Stage 7 — API pública, MCP y complemento Blender

**Objetivo:** permitir uso programático y profesional con la misma contabilidad.

- Documentar REST/OpenAPI y ejemplos TS/Python.
- Token API con scopes y límites, rotación/revocación; webhooks con firma y replay protection.
- MCP server con listado, quote, generate, poll, export. Ninguna acción irreversible sin permiso.
- Addon Blender que consulta biblioteca, lanza generación e importa un asset.
- Demo end-to-end con una cuenta de testing sin privilegios de administrador.

**Gate:** tests de presupuesto compartido entre UI/API/MCP y de revocación de tokens; importar asset en Blender con orientación/escala verificadas.

## Stage 8 — WooCommerce, Unity, Unreal y capacidades avanzadas

**Condición de inicio:** evidencia de usuarios activos y demanda específica por esas integraciones.

- Plugin WooCommerce con manejo de medios, visor y configuración segura.
- Unity/Unreal adapters con importación correcta, materiales y documentación de versiones soportadas.
- Batch jobs, teams, revisiones y controles avanzados solo si uso real lo justifica.

**Gate:** métricas de adopción y costo de mantenimiento, plugin probado y soporte asumible. No retrasar venta inicial por cumplir este stage.

## Stage 9 — Gate comercial antes de cualquier ampliación fuera del 3D base

Recoger datos de uso real y cobros válidos: usuarios que generan y vuelven, porcentaje de resultados utilizables, frecuencia mensual de nuevos productos/assets, tasa de cancelación, tickets, pagos por créditos adicionales y margen real. **La creación de videos queda excluida** hasta aprobar esta revisión y abrir un brief nuevo, separado del actual.

---

# 11. Funcionalidades detalladas por stage y verificaciones de usuario

| Historia de usuario | Comportamiento esperado | Validación automatizada/manual | Stage |
|---|---|---|---|
| Comercio nuevo | Responde 3 preguntas y ve conversión foto→3D destacada | E2E cambio perfil, sin pérdida de estado | 3 |
| Desarrollador | Ve exportación y controles de polígonos según motor | Contra matriz de capacidades | 2–3 |
| Artista 3D | Selecciona versión, semilla y textura compatibles | API rechaza parámetros no soportados | 2 |
| Usuario con poco saldo | Recibe quote y no inicia trabajo no financiado | Tests de concurrencia y race conditions | 4 |
| Usuario con ejecución fallida | Ve error y política de devolución aplicada | Ledger consistente y log de proveedor | 1–4 |
| Dueño de asset | Compara versiones y puede descargar la original | Inspección hash, ACL y conversión | 5 |
| Comercio con Shopify | Elige producto, confirma y publica asset | Tienda test, resultado remoto y auditable | 6 |
| Usuario de MCP | Cotiza trabajo, genera, consulta, exporta | Prueba en cliente compatible y créditos | 7 |
| Administrador técnico | Desactiva proveedor caro/roto sin desplegar código | Feature flag en entorno de staging | 2 |
| Usuario de pack | Compra créditos y suscripción sin doble grant | Webhook doble + reconciliación | 4 |

## 11.1 Métricas de producto prioritarias

- Activación: cuenta que completa una primera generación usable y puede abrir el GLB.
- Conversión a segundo uso: vuelve a generar en 7/30 días.
- Resultado utilizable: asset aprobado por comprador/panel de QA, no solamente HTTP 200.
- Fidelidad en comercio: correspondencia de silueta/textura y número de reclamaciones por producto mal representado.
- Funcionalidad profesional: assets importables sin intervención costosa.
- Economía: `cost_per_usable_asset`, margen por cliente, consumo p50/p95, pack attach rate, tickets de soporte por 100 trabajos.

## 11.2 Criterios de calidad mínima antes de publicar planes

Un proveedor pasa a producción solo si: endpoint estable, licencia aprobada, salida válida, costo reconciliado, webhook/idempotencia funcionando, resultado comparable por benchmark y documentación de fallos/limitaciones. No se debe ocultar al usuario si el input multivista fue reducido a una sola vista.

---

# 12. Prompt maestro para entregar directamente al coder

> **INSTRUCCIÓN:** Copiar la sección completa siguiente al agente coder junto con este documento y el catálogo CSV. El agente debe comenzar auditando el repo, no sobreescribir el proyecto ni inventar un stack. Cada stage exige aprobación basada en evidencia, no mero código.

```text
ACTÚA COMO:
Principal Software Engineer, Technical Product Manager, 3D Pipeline Engineer,
SaaS Billing Architect y QA Lead para Product3D Studio.

MISIÓN:
Trabajar sobre mi aplicación EXISTENTE para convertirla en un producto de creación
3D multimodelo, personalizable por perfil y orientado a e-commerce, game development
y profesionales 3D. La experiencia debe ser intuitiva como una plataforma creativa
estilo Higgsfield, con capacidades profesionales semejantes a Hyper3D,
SIN copiar propiedad intelectual ni interfaz de competidores.

LEE PRIMERO:
1. PRODUCT3D_INFORME_MAESTRO.md completo.
2. CATALOGO_APIS_3D.csv.
3. El documento fuente original incluido en el informe.
4. README, estructura, migraciones y servicios existentes en el repositorio.

RESTRICCIONES ABSOLUTAS:
- NO desarrollar landing ni marketing.
- NO implementar generación/edición/render de videos; revaluar solo tras validación.
- NO prometer modelos comerciales de precisión sin pruebas.
- NO simular integraciones de producción ni usar datos falsos como si fueran reales.
- NO habilitar todos los motores sin validar API, versión, costo, licencia y calidad.
- NO exponer keys ni tokens en frontend, repo, logs o respuestas.
- NO inventar precios, compatibilidad con motores o atributos 3D.
- NO borrar ni reconstruir el repo sin necesidad y sin plan de migración.
- NO activar cobros reales o publicar en tiendas sin autorización explícita.

ETAPA OBLIGATORIA 0 — AUDITORÍA:
Inspecciona código y entrega primero AUDITORIA_ESTADO_ACTUAL.md con:
- arquitectura existente y rutas,
- funcionalidades operativas / parciales / mocks,
- base de datos, auth, workers, proveedores, facturación,
- errores, riesgos, dependencias y brechas,
- plan incremental por stages,
- criterios de aceptación y presupuesto de pruebas.
Solicita al dueño la información o permisos que falten; jamás finjas tenerlos.

OBJETIVO DE PRODUCTO:
A. Onboarding de 3 preguntas (uso, experiencia, objetivo) editable/omitable.
B. Dashboard adaptada a Commerce / Game / Professional; herramientas completas
   disponibles para todos si la suscripción autoriza su uso.
C. Galería de ejemplos 3D VERIFICADOS y reproducibles con metadatos reales.
D. Creación Text→3D, Image→3D, Multi-view→3D a través de provider adapters.
E. 3–5 endpoints complementarios en producción después de benchmark objetivo.
F. Presets Fast, Studio, Game y Advanced con costos visibles y capacidades reales.
G. Biblioteca privada con versiones, comparación, thumbnails y exportaciones.
H. Vista interactiva GLB, diagnóstico de malla, formatos y optimización probada.
I. API central y cola persistente; job states, idempotencia, errores, webhook.
J. ProductCredits internos, cotización previa, reserva atómica, captura/reversión,
   packs adicionales y planes configurables que mantengan margen real.
K. Shopify como primera integración: OAuth, seleccionar producto, confirmar publicar,
   subida/relación de media usando GraphQL vigente; no usar mutaciones deprecadas.
L. Embed web, luego Blender, MCP, WooCommerce, Unity y Unreal por demanda y stages.
M. Monitorización de costes por proveedor, tasas de aceptación y benchmark.

ANÁLISIS DE APIS — INSTRUCCIÓN CRÍTICA:
Lee LAS 46 FILAS de CATALOGO_APIS_3D.csv. Para cada una:
1) comprueba si la versión/endpoint existe hoy;
2) revisa fuentes PRIMARIAS de documentación y pricing;
3) distingue USD, créditos de proveedor y ProductCredits internos;
4) comprueba licencia para reventa/intermediación SaaS y data handling;
5) anota las modalidades soportadas, parámetros, formatos y límites;
6) prueba en sandbox con presupuesto máximo autorizado;
7) calcula costo por llamada real, addons, retries, posproceso y costo por asset usable;
8) asigna estado ENABLE / BACKLOG / REJECT con evidencia;
9) selecciona una cartera inicial de 3–5 modelos complementarios.
NUNCA conviertas el costo estimado del documento original en precio confirmado.

ECONOMÍA Y PRECIOS:
Propón al menos 3 estructuras viables de plan (ej. base + packs mensuales,
créditos recargables, uso por consumo), con tablas de costos unitarios,
uso extremo, límites, comisiones, márgenes y estrategia ante cambios de tarifas.
Evalúa como hipótesis Starter $19/150, Creator $49/500, Commerce $99/1100,
Studio $199/2400 ProductCredits, pero MODIFICA las asignaciones si la prueba
indica que no entregan valor o no dejan margen. No son decisiones finales.
No implementar pricing sin resultados comparativos y aprobación explícita.

ARQUITECTURA:
Provider Registry + Adapter Interface + Quote Service + Job Orchestrator +
Asset Storage/Pipeline + immutable Credit Ledger + Integration Gateway.
Crear migraciones compatibles con el repo, sin sacrificar seguridad/RLS.
Asegura misma fuente de verdad para generación web, API, MCP y plugins.

FORMA DE TRABAJAR:
- Un stage a la vez, empezar por STAGE 0.
- Antes de cada stage: plan, riesgos, archivos a modificar, migraciones, tests.
- Después de cada stage: código funcional, pruebas, capturas locales si útiles,
  cambios de schema, costo de proveedor y documentación.
- No declares DONE si hay mocks, botones inertes o errores que impiden el flujo.
- Mide calidad de generación con dataset autorizado y reporte por proveedor.
- Si falta un secreto o aprobación, añade instrucción exacta de configuración
  SIN pedir que se comparta una clave sensible en el chat.
- Usar feature flags para features no validadas.
- Todo lo que no está en alcance debe quedar en BACKLOG, no desarrollarse.

PRIMERA RESPUESTA QUE QUIERO:
1. Resumen del repositorio actual (hechos verificados).
2. Lista de funcionalidades actuales reales vs. faltantes.
3. Riesgos y bloqueos prioritarios.
4. Tabla de selección de modelos/API a investigar.
5. Orden exacto de stages y cronograma condicionado a complejidad.
6. Propuesta de pruebas y presupuesto para experimentos pagados.
7. Preguntas imprescindibles (máximo 5) para comenzar sin inventar supuestos.

AL FINAL DE CADA STAGE:
Entrega checklist de aceptación, resultados de tests, costos ejecutados,
pendientes y el siguiente paso recomendado. No pases a producción sin
confirmación cuando implique facturación, claves o publicación externa.
```

---

# 13. Criterios de decisión del dueño: aceptar, iterar o cancelar

Antes de declarar que el producto puede recibir clientes de pago:

- [ ] Existen al menos dos motores probados y un tercero preparado para fallback selectivo.
- [ ] Todos los botones de generación, inspección, biblioteca y exportación hacen operaciones reales.
- [ ] Onboarding cambia la experiencia sin romper accesibilidad de herramientas.
- [ ] Al menos 30 inputs de benchmark evaluados con datos de calidad y costos.
- [ ] Precios de TODOS los modelos habilitados comprobados en fuente oficial y factura/test.
- [ ] Se conoce costo por **asset utilizable**, no solo por API call exitosa.
- [ ] El margen de los planes es positivo bajo escenarios de alto uso y costo adverso.
- [ ] El saldo no puede volverse negativo; pagos y webhooks idempotentes.
- [ ] Datos de usuarios, modelos y conexiones de tiendas aislados por propietario.
- [ ] Exportación GLB y visor funcionan en navegadores y dispositivos de prueba.
- [ ] Política de contenido, derechos de activos, fallos y reembolsos definida.
- [ ] Soporte, monitoreo, backups, límites y revocación de accesos preparados.
- [ ] Shopify funcionando si se anuncia como integración disponible (en caso contrario, indicar beta o próximamente en dashboard, no fingir operatividad).
- [ ] No hay implementación de landing, marketing ni videos en el alcance entregado.

---

# 14. Referencias de implementación y advertencias de fuentes

**Documento principal incorporado**  
Catálogo de modelos entregado por el dueño: https://docs.google.com/document/d/1XvUK3qa2vc7QOH8sJj1zQCTy-D4dy7AtYDgowF531AY/edit

**Fuentes oficiales verificadas al preparar esta especificación:**

1. Meshy API pricing — https://docs.meshy.ai/en/api/pricing
2. Meshy API productos — https://www.meshy.ai/api
3. Tripo OpenAPI pricing — https://docs.tripo3d.ai/get-started/pricing.html
4. Hyper3D Rodin 2.5 spec — https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5
5. Rodin 2.5 en fal — https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5
6. Rodin 2.5 Fast — https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5/fast
7. Tripo H3.1 — https://fal.ai/models/tripo3d/h3.1/image-to-3d
8. Hunyuan 3D v3.1 — https://fal.ai/hunyuan-3d
9. TRELLIS — https://fal.ai/models/fal-ai/trellis
10. TRELLIS.2 — https://fal.ai/models/fal-ai/trellis-2
11. Stability AI prices — https://platform.stability.ai/pricing
12. fal pricing — https://fal.ai/pricing
13. Shopify media guide — https://shopify.dev/docs/apps/build/product-merchandising/products-and-collections/manage-media
14. Shopify staged uploads — https://shopify.dev/docs/api/admin-graphql/latest/mutations/stageduploadscreate
15. Shopify deprecated `productCreateMedia` — https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreateMedia

**Advertencia sobre el documento fuente:** se encontraron modelos antiguos, estimaciones en dólares sin factura verificable, endpoints potencialmente descontinuados y afirmaciones de capacidades que deben reevaluarse. La presencia de un nombre en el catálogo NO constituye prueba de que exista hoy, de que tenga API pública o de que permita revender las salidas en un SaaS. La disponibilidad y las condiciones cambian: la decisión final corresponde a una verificación del coder sobre documentación, consola y términos actuales.

**Notas técnicas:** el umbral de ProductCredits por dólar, objetivos de margen y precios incluidos son ejemplos de diseño, no tarifas comerciales aprobadas. Reajustar después del benchmark y pruebas de pago. Toda funcionalidad futura fuera de alcance requiere nueva especificación y autorización.
