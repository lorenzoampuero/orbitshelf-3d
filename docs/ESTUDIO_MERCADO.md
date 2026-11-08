# Estudio de mercado, competencia y canales de OrbitShelf 3D

Fecha de redacción: 8 de noviembre de 2026. Es un análisis honesto, no un argumento de venta. Casi todas las cifras de mercado salen de blogs, agregadores y datos que declaran las propias empresas. No hay una sola cifra verificada con cuentas propias, porque todavía no hay tráfico, clientes ni gasto en anuncios. Cada dato lleva su nivel de confianza en la sección 9.

Las proyecciones numéricas están en `docs/PROYECCION_CLIENTES.md` y se regeneran con `npx tsx --conditions=react-server scripts/project-customers.ts`.

## 1. Veredicto corto

1. **El mercado existe y crece.** Meshy declara más de US$100 millones de ingresos anuales y 15 millones de usuarios (dato de la empresa, septiembre de 2026). Hay demanda de pago por convertir foto o texto en 3D.
2. **"Otro generador de 3D" no es una posición defendible.** Los dueños de motor (Meshy, Tripo, Hyper3D/Rodin, Luma) venden la generación más barata de lo que tú puedes revenderla con piso de margen de 60 %. Quien compare solo por precio por modelo te va a descartar.
3. **Sí hay un hueco en el flujo completo para tiendas y estudios chicos:** subir foto, generar con el motor que mejor sirve para ese objeto, revisar, optimizar, aprobar, publicar (visor embebible, Shopify, API) y llevar el control del gasto. Eso es lo que hoy ninguno de los grandes empaqueta bien para una tienda pequeña. Es una hipótesis, no un hecho: hay que probarla con clientes reales.
4. **Con el producto listo a fines de noviembre, más de 10 clientes de pago en marzo es posible pero no está asegurado.** El escenario realista da 16, el pesimista 8 y el optimista 48. Casi todo llega por contacto directo y redes, no por publicidad.
5. **La publicidad pagada no es el primer paso.** Con las conversiones normales del sector, un cliente pagado cuesta más de lo que deja. Se prueba con presupuesto chico a partir del mes 3, cuando ya existe una página que convierte y cifras propias.
6. **El mayor riesgo no es el marketing, es que el producto genere modelos reales con motores que tengas permiso de revender.** Hoy sigue pendiente (ver `docs/INFORME_CODEX.md`). Si eso se atrasa, todo lo demás se corre igual.

## 2. Nicho y a quién le vendemos

| Segmento | Dolor | Qué compra | Disposición a pagar (hipótesis) | Dificultad de venta |
|---|---|---|---|---|
| **Tiendas online chicas y medianas** (Shopify, tiendas propias) con 20 a 500 productos | El 3D y la realidad aumentada suben la conversión, pero un modelador cuesta más que el producto | Modelos de productos aprobados, visor para la ficha, publicación en Shopify | US$49 a US$179 al mes, o un paquete inicial | Media: hay que enseñar qué ganan, pero el valor es fácil de explicar |
| **Estudios de juegos indie y equipos chicos** | Hacen decenas de assets de relleno y no tienen tiempo | Generación con control de polígonos, exportación GLB, OBJ y STL, API | US$49 a US$199 al mes | Alta: son escépticos con la calidad del 3D generado |
| **Diseñadores 3D y artistas** | Partir de una base para ahorrar horas de bloqueo | Base rápida que se termina en Blender | US$19 a US$49 al mes | Alta: precio sensible, muchas alternativas gratuitas |
| **Agencias que atienden tiendas** | Quieren revender 3D como servicio | Cuenta de agencia, lotes, API | US$199 o más | Media, pero tarda en cerrarse |

**Dónde empezar:** tiendas online. Tienen un resultado medible (conversión, devoluciones), presupuesto de marketing y se pueden contactar una por una. Estudios y diseñadores llegan solos con el contenido, pero convierten menos al principio.

**Dato de apoyo con reservas:** GANT hizo una prueba controlada y declaró +6,3 % de conversión con 3D. Es un caso de una marca grande, publicado por quien vende la tecnología. Otras cifras de proveedores (25 %, 62 %, "94 %") no tienen metodología visible y **no se usan en la web**.

## 3. Competencia

| Competidor | Qué ofrece | Precio de entrada (aprox., a verificar) | Fortaleza | Debilidad frente a nosotros |
|---|---|---|---|---|
| **Meshy** | Imagen y texto a 3D, texturas, animación, plugins | Planes desde unos US$20 | Escala, marca, comunidad, plugins | Orientado a creadores individuales; poca capa de tienda o aprobación |
| **Tripo** | Imagen y texto a 3D, retopología, API | Unos US$20 | Calidad y velocidad | Igual: generador, no flujo de tienda |
| **Hyper3D / Rodin** | Motor propio, alta calidad, muchos planes | US$12 a US$120 | Motor propio, precio por modelo muy bajo | Mismo punto: es motor, no flujo de publicación |
| **Luma** | Captura y generación 3D | US$30 a US$300 | Calidad en captura | Más caro, otro enfoque |
| **Kaedim** | 3D con revisión humana, orientado a estudios | US$50 a US$1.200 | Resultado revisado por personas | Caro y lento para tiendas chicas |
| **Sloyd** | 3D paramétrico para juegos | Unos US$15 | Control y rapidez | Otro tipo de resultado (paramétrico) |
| **Herramientas de Shopify / AR** | Visores y AR para tiendas | Varía | Integradas | No generan el modelo |

**Cómo se compara el precio por modelo.** Hyper3D declara unos 60 modelos por US$30 (US$0,50 cada uno) y unos 416 por US$120 (US$0,29). Con el piso de 60 % de margen, un modelo con un buen motor te sale por unos US$0,74 a US$1,88 en el plan Creator (US$49). **No puedes ganar por precio por modelo y no debes intentarlo.** Esas cantidades las estiman ellos y puede que no sean comparables (otro nivel de calidad, otra resolución de textura).

## 4. Posicionamiento recomendado

**Promesa:** "De una foto a un modelo 3D aprobado y publicado en tu tienda, sin modelador."

Lo que se vende no es la generación, es **el resultado listo para usar y el control**:

1. **Varios motores en un solo lugar,** elegidos por tipo de objeto, con el costo en créditos a la vista antes de confirmar.
2. **Revisión antes de publicar:** vista de malla, diagnóstico, versiones y comparación.
3. **Optimización y exportación** (GLB, OBJ, STL) y visor embebible.
4. **Publicación** en Shopify (en pruebas hasta verificarlo en una tienda real), API y webhooks.
5. **Gasto controlado:** créditos, historial, sin sorpresas.

**Qué no se afirma en la web:** ControlNet, edición parcial, avatares, video, reintentos gratis, sellos de seguridad que no tenemos, cantidad de usuarios o logos de clientes que no existen. Esto ya figura en el plan de diseño y en las reglas de honestidad del proyecto.

**Cuña de entrada para tiendas:** un **primer catálogo asistido** (tú o un freelance ayuda a fotografiar, generar y aprobar los 5 a 10 primeros productos). Cuesta tiempo, no dinero, y convierte la duda "¿funcionará con mis productos?" en una prueba concreta. Es el canal con mejor relación costo-resultado para los primeros 10 clientes.

### Precios: ¿están bien?

| Plan | Precio | Créditos | Comentario |
|---|---:|---:|---|
| Starter | US$19 fijo | 200 | Entrada fácil, comparable a Meshy y Tripo. Pocos modelos por mes. |
| Creator | US$49 a US$89 | 550 a 1.000 | Corazón del producto para diseñadores y tiendas chicas. |
| Commerce | US$99 a US$179 | 1.100 a 2.050 | Tiendas con catálogo. Es el plan que más importa para el ingreso. |
| Studio | US$199 a US$499 | 2.300 a 5.800 | Estudios y agencias. Pocos clientes, mucho valor. |

- El margen del piso (60 % con uso completo) se cumple por diseño. En la práctica, el uso suele ser menor al 100 %, así que el margen real sube.
- Las marcas grandes pueden bajar precios y tú no. Por eso conviene vender **resultado y servicio**, no créditos.
- **Reglas que se mantienen:** sin descuentos falsos, sin plan anual por ahora, sin generación gratis antes de confirmar.

### Funcionalidades: dónde estás

| Tema | Estado frente a la competencia |
|---|---|
| Imagen a 3D, texto a 3D, varias fotos | Al nivel de los demás, si los motores están activos |
| Importar GLB, optimizar, comparar versiones | **Ventaja:** pocos lo tienen en el mismo lugar |
| Visor público y embebible, biblioteca, favoritos | **Ventaja** para tiendas |
| API con tokens, webhooks | Al nivel o mejor que lo básico |
| Shopify | Pendiente de prueba en una tienda real |
| Retopología, rigging, animación | **Falta.** Meshy y Tripo sí. No prometer |
| Plugin de Blender o Unity | **Falta.** Importante para estudios |
| Motor propio | No existe y no conviene construirlo |

### Visión

A tres años: **la capa de trabajo del 3D generado** para quien no es modelador. Cualquier motor puede conectarse; el valor está en revisar, optimizar, publicar y controlar el gasto. Esto es una dirección, no una promesa de producto.

## 5. Canales de adquisición

Resumen de lo que se encontró y qué hacer con cada uno. Las cifras son de terceros.

| Canal | Qué dicen las fuentes | Costo por cliente estimado para nosotros | Recomendación |
|---|---|---|---|
| **Contacto directo + primer catálogo asistido** (correo, mensajes, comunidades de Shopify) | No hay cifra pública fiable; depende de tu tiempo | Unos US$30 en herramientas, más horas tuyas | **Empezar ya.** Es el que decide si llegas a 10. Objetivo: 15 a 20 contactos a la semana |
| **Contenido y SEO (blog)** | Sin tráfico al inicio; sube desde el mes 3 a 4. Palabras clave de volumen: "image to 3d" unas 33.000 búsquedas al mes y CPC unos US$0,9; "ai 3d model generator" unas 29.000 y US$1,29 (estimaciones de un agregador, no de Google) | Unos US$25 | **Sí**, pero es de largo plazo. Escribir sobre problemas de tiendas y estudios, no solo "mejor generador" |
| **TikTok, Reels, Shorts** | Conversión de SaaS en TikTok 1 % a 3 %; los casos "virales" son anecdóticos | Unos US$20 más tu tiempo | **Sí, como lanzamiento barato:** antes y después, un modelo girando, un proceso. No contar con un video viral; contar con constancia |
| **Google Ads** | CPC de las búsquedas de "image to 3d" unos US$1 a US$1,3; CAC de SaaS B2B pagado US$300 a US$800 | US$500 con los supuestos realistas | **Probar con US$300 al mes desde el mes 3**, solo con palabras exactas y de intención ("convertir foto de producto a 3D para Shopify"). Parar si el costo por registro pasa de lo previsto |
| **Meta Ads (Facebook e Instagram)** | CPC en SaaS US$2 a US$4,5; costo por lead US$40 a US$90 | Más alto que en Google | **Solo para retargeting o tiendas** y después de tener cifras. No es la primera apuesta |
| **ChatGPT Ads** | Anuncios con autoservicio desde mayo de 2026; CPM de US$25 a US$60 y CPC sugerido de US$3 a US$5 (solo blogs de agencias, sin fuente oficial leída) | Probablemente alto y sin historia | **Experimento chico y tardío.** Antes verificar precios, mínimos y formatos reales en la plataforma |
| **Socios** (agencias de Shopify, freelancers de 3D, creadores) | Sin cifras públicas | Comisión o crédito de regalo | **Muy bueno para tiendas.** Un socio con 10 clientes vale más que 10 anuncios |

**Por qué la publicidad pagada no funciona de entrada.** Con 3 % de visitas que se registran y 8 % de registros que pagan, cada cliente pagado cuesta unos US$500 con un CPC de US$1,2. Un cliente deja unos US$37 al mes y se queda unos 14 meses (valor US$524). Es decir, la publicidad **apenas empata** y solo mejora si la conversión sube. Sin prueba gratis de generación (cada intento te cuesta dinero), la conversión de registro a pago es menos favorable que en un SaaS típico con prueba.

## 6. Proyección en meses (resumen)

Valores del script `scripts/project-customers.ts`. Son supuestos, no promesas.

| Escenario | Mes 3 (feb) | Mes 4 (mar) | Mes 6 | Mes 8 | Mes 10 | Mes 12 (nov) |
|---|---:|---:|---:|---:|---:|---:|
| Pesimista | 6 | 8 | 15 | 23 | 31 | 40 |
| Realista | 10 | 16 | 31 | 48 | 67 | 88 |
| Optimista | 29 | 48 | 91 | 141 | 198 | 259 |

- **Pesimista:** el producto sale justo, los motores rinden poco, la conversión es baja y los primeros clientes vienen casi solo por contacto directo. Cuesta llegar a 10.
- **Realista:** contacto directo constante, algo de contenido desde el mes 3, redes y un presupuesto de anuncios de US$500 que apenas empata.
- **Optimista:** hay un buen ajuste con tiendas, los socios traen clientes, el contenido pega y los anuncios convierten mejor que el promedio.

Ingreso mensual recurrente en el mes 12: US$1.463 (pesimista), US$4.002 (realista), US$14.119 (optimista). El pesimista llega al equilibrio recién hacia el mes 8 y no recupera lo invertido en el año.

## 7. Cómo llegar a mejores cifras

En orden de impacto:

1. **Vender el primer catálogo asistido** a 10 tiendas conocidas, con una garantía clara (si no se aprueba el modelo, se devuelven los créditos). Cierra por confianza, no por anuncio.
2. **Subir la mezcla hacia Commerce.** Un cliente Commerce vale el doble que uno Creator. Los textos de la web y la cuña de entrada deben apuntar a catálogos.
3. **Bajar el abandono.** Cada punto menos de abandono mensual agrega más clientes en el año que duplicar anuncios. Se logra con aprobación rápida del primer modelo y con avisos cuando quedan pocos créditos.
4. **Socios y agencias.** Un acuerdo con 2 o 3 agencias de Shopify.
5. **Medir desde el día 1:** visitas, registros, primer modelo, primer pago. Sin eso no se sabe cuándo gastar en anuncios.
6. **Mejorar la conversión de la web:** ejemplos reales (no inventados), precios claros, preguntas sin letra chica. Es lo que expanden las páginas nuevas.
7. **Reducir el costo del motor** si se negocia mejor con un proveedor (sube el margen, no necesariamente el ingreso).

## 8. Riesgos principales

| Riesgo | Efecto | Qué hacer |
|---|---|---|
| Permisos de reventa de los motores sin confirmar por escrito | No puedes vender de forma legal | Pedirlos por escrito ya, y tener un motor alternativo |
| Calidad desigual del 3D generado | Reembolsos y mala fama | Mostrar resultados reales con sus límites; ofrecer revisión |
| Guerra de precios de los dueños de motor | Tu precio por modelo queda caro | Vender flujo y servicio, no créditos |
| Pagos: Whop no verificado con un pago real | No cobras en diciembre | Prueba de pago real antes del lanzamiento (ver `docs/WHOP.md`) |
| Dependencia de tu tiempo | El contacto directo se frena | Calendario fijo semanal y plantillas |
| Ley de datos de Chile (Ley 21.719) y reglas de IA de la UE (artículo 50) | Multas y bloqueos | Revisión de un abogado; los textos legales de la web son borrador |
| Costos sin facturas reales | El margen real puede diferir | Registrar costos del motor desde el primer render |

## 9. Fuentes y confianza

| Dato | Fuente | Confianza |
|---|---|---|
| Meshy más de US$100 millones al año, 15 millones de usuarios, US$400 millones de ronda | La propia empresa y prensa tecnológica | Media (declarado por la empresa) |
| ChatGPT Ads con autoservicio desde mayo de 2026, CPM US$25 a US$60 y CPC US$3 a US$5 | Blogs de agencias | Baja: ninguna fuente oficial leída |
| "image to 3d" unas 33.000 búsquedas al mes, CPC US$0,9; "ai 3d model generator" unas 29.000 y US$1,29 | indexator.ai (estimación) | Baja a media: no es Google |
| GANT +6,3 % de conversión con 3D | Prueba controlada publicada por el proveedor | Media |
| Precios de Tripo, Rodin, Luma, Kaedim, Sloyd | Páginas públicas, revisadas a mano | Media: pueden cambiar sin aviso |
| CAC de SaaS B2B pagado US$300 a US$800; de prueba a pago 8 % a 20 %; de visita a prueba 2 % a 5 % | Estudios y blogs de benchmarks | Media |
| Meta en SaaS: CPC US$2 a US$4,5, costo por lead US$40 a US$90 | Blogs de agencias | Baja a media |
| TikTok en SaaS: conversión 1 % a 3 % | Blogs de marketing | Baja: casos virales son anecdóticos |
| Ley 21.719 de Chile (vigencia 1 de diciembre de 2026; proyecto de postergación pendiente) | Fuentes secundarias | Media: **revisar con abogado** |
| Reglamento de IA de la UE, artículo 50 (desde el 2 de agosto de 2026; marcado del 50(2) movido al 2 de diciembre de 2026 para sistemas existentes) | Fuentes secundarias | Media: **revisar con abogado** |
| Ahrefs | Herramienta conectada, plan insuficiente | No disponible |

**Qué falta para convertir este estudio en datos:** una cuenta de Google Search Console y Ads con datos propios, una prueba de pago en Whop y los primeros 20 contactos con respuesta.

## 10. Plan para las próximas 4 semanas (vista de mercado)

| Semana | Foco |
|---|---|
| 1 (9 al 15 de nov) | Cerrar la web: textos expandidos, blog, páginas legales en borrador. Lista de 50 tiendas objetivo |
| 2 (16 al 22 de nov) | Pedir permisos de reventa por escrito. Prueba de pago en Whop. Primeros 15 contactos con propuesta de catálogo asistido |
| 3 (23 al 29 de nov) | Primer motor activo con presupuesto aprobado. Primeros modelos reales para la web. Videos cortos de proceso |
| 4 (30 de nov al 6 de dic) | Lanzamiento suave a los contactos. Medición de visitas, registros y pagos. Decidir si se prueban anuncios en febrero |
