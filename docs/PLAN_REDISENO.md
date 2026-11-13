# Plan maestro: rediseño visual completo de OrbitShelf 3D

Documento de ejecución para un modelo implementador. No se implementa nada hasta aprobarlo. Primer paso al ejecutar: copiar este archivo a `orbitshelf-3d/docs/PLAN_REDISENO.md`.

## 0. Contexto

OrbitShelf 3D es una plataforma de foto o texto a modelo 3D para tiendas, estudios de juegos y diseñadores (Next.js 16, React 19, Tailwind 4, `@google/model-viewer`). La arquitectura y las funciones están hechas y probadas, pero el producto no se percibe premium: la dashboard no tiene sistema de componentes, cada pantalla estiliza a mano, no hay estados de carga, y solo la home tiene arte real. El dueño quiere el nivel visual de Hyper3D (referencia principal) y Higgsfield (secundaria), con identidad propia, usando como protagonistas los 33 modelos que entregó.

**Estado del repo al escribir este plan:** `main` en `04a0a9c`. Encima hay trabajo sin commit: home nueva con renders, navbar con imágenes, `scripts/render-landing.py`, `scripts/build-landing-art.ts`, `public/landing/` (3 modelos completos y 4 CC0), componentes en `src/components/home/`. Pasan 336 unitarias y 22 e2e. Conviene un commit de control antes de empezar (pedir permiso al dueño).

**Reglas fijas del proyecto (no negociables en el rediseño):**
1. No se elimina ninguna función. Los `data-testid` y textos que usa `tests/e2e/app.spec.ts` se conservan (lista en §9.3).
2. Sin notas de origen sobre los modelos en la web. Tampoco se afirma que se hicieron con OrbitShelf, y no van en `src/config/showcase.ts` (esa lista es solo de resultados reales del producto).
3. Sin prueba social inventada: nada de logos de clientes, nombres de usuarios, "likes" ni contadores falsos. Sin barras de progreso inventadas: el estado mostrado es el del trabajo real.
4. No se muestran funciones que no existen (edición por partes, rigging, animación, 4K, control de detalle). Si un efecto visual sugiere una función, no se usa.
5. Inglés es el idioma principal (`/`), español en `/es`. Todo texto nuevo va en ambos.
6. Accesibilidad AA, `prefers-reduced-motion`, texto de 12 px o más, sin desborde horizontal a 375 px.
7. US$0 en motores. `AGENTS.md`: este Next tiene cambios incompatibles; leer `node_modules/next/dist/docs/` antes de usar una API.
8. Sin commit ni push sin que el dueño lo pida.

## 1. Auditoría del estado actual

| Área | Hallazgo | Consecuencia para el rediseño |
|---|---|---|
| Sistema de UI | No existe `components/ui`. Botones y tarjetas son clases sueltas. Radix (`dialog`, `dropdown-menu`, `slot`) y `cva` están instalados y sin usar. Diálogos y menús hechos a mano | Fase 1 crea el kit; todo lo demás lo consume |
| Tema | `[data-theme="app"]` repite `:root`. Solo oscuro. Superficies azul-violeta saturadas (`#15132a`) que tiñen los renders | Nueva paleta neutra; el violeta queda como acento |
| Tipografía | Poppins para todo, igual que Hyper3D. Instrument Sans instalada sin usar | Nueva pareja tipográfica propia |
| Movimiento | Solo CSS (`.reveal`, `float-slow`, build, marquee). Sin librería | Añadir `motion` para transiciones de layout y resortes |
| Estados | Sin `loading.tsx`, `error.tsx`, esqueletos ni toasts | Se crean en Fases 1 y 5–7 |
| Shell dashboard | Solo barra superior tipo píldora (`dashboard-shell.tsx`, 252 líneas). El selector de espacio de trabajo vive en la página de inicio | Riel lateral + barra de utilidades |
| Crear | Compositor en inicio + formulario largo de 12 columnas en `/create` (596 líneas) | Espacio de trabajo de 3 zonas |
| Biblioteca | Barra de 5 columnas de filtros + rejilla de 3 | Muro de medios con barra de herramientas |
| Estudio del modelo | 749 líneas, visor en 7 columnas y todo lo demás apilado | Visor dominante + inspector por secciones |
| Visor público | `app/embed/[token]/route.ts` devuelve HTML en cadenas, con su CSP | Se rediseña editando la plantilla, sin React |
| Marketing | Home ya con arte. Resto de páginas con iconos y rejillas CSS. 31 rutas comprobadas por el test 8 | Plantillas por tipo de página |
| 3D | Un único envoltorio (`model-viewer-box.tsx`). `three` solo transitivo | Se mantiene model-viewer; se añade giro pre-renderizado |
| Optimizador | `optimizeGlb` preset web entregó 122.858 triángulos y 8,2 MB con una malla real de 2 M (meta: 50.000 y 5 MB) | Fuera de este plan visual, pero bloquea la promesa del producto. Tarea aparte |

## 2. Referencias: qué las hace premium

Capturas tomadas el 2026-11-09 (ya enviadas al dueño). En Fase 0 se vuelven a capturar a `docs/referencias/` para el implementador (uso interno, no publicar).

| Rasgo | Hyper3D | Higgsfield | Qué adopta OrbitShelf |
|---|---|---|---|
| Fondo | `#121212` neutro | `#0f1113` neutro | Grafito neutro: los modelos ponen el color |
| Acento | Degradado durazno-lila solo en el CTA | Lima ácido `#d1fe17` con texto negro, único | Un solo acento (violeta propio) usado con disciplina |
| Tipos | Poppins | Space Grotesk bold en mayúsculas + Inter + Space Mono | Display propia + sans de texto + mono para datos |
| Medios | 244 imágenes, 0 canvas en la landing; objetos que se salen de la tarjeta | 52 videos en tarjetas; el producto es la portada | Render pre-hecho en todas partes; 1 visor vivo por pantalla |
| Estructura | Hero con mini generador, bento, "cómo funciona", cierre | Sin hero de texto: carrusel de medios, rejilla de herramientas, muros de galería | Hero con compositor real + muro de modelos tipo estante |
| Galería | Miniaturas de estudio uniformes sobre fondo oscuro | Mosaico con contadores y autores | Miniaturas de estudio uniformes, sin contadores ni autores |
| Generador | Tarjeta central, botón grande, selector de versión y calidad debajo | Barra de prompt con modelo y formato como chips | Compositor con chips de modelo, calidad y costo en créditos |
| Detalle | Modal: visor + panel Formato / Extras / Descargar | — | Inspector lateral por secciones |
| Movimiento | Solo CSS: entrada con resorte, flotado, texto que se escribe | Video en bucle, transiciones de deslizamiento | CSS + `motion` para layout; video y secuencias pre-renderizadas |
| Radios | Tarjetas grandes ~24 px, píldoras | 8/12/16/20/24, píldoras | Escala única 8/12/16/24 + píldora |

Principios que se extraen: (1) el contenido generado es la interfaz; (2) negro neutro y un solo color de marca; (3) iluminación de estudio idéntica en todas las miniaturas; (4) jerarquía tipográfica fuerte con muy poco texto; (5) el generador está siempre a un clic; (6) movimiento corto y con propósito.

**Pendiente del dueño:** las pantallas internas de Hyper3D (generar y refinar) están tras el login. Si inicia sesión en el panel del navegador o manda capturas, se añaden a `docs/referencias/` antes de la Fase 5.

## 3. Dirección de arte y sistema de diseño

**Concepto: "Estudio en órbita".** Cada modelo se presenta como en un estudio fotográfico oscuro, sobre un escenario con un anillo orbital fino (la "órbita" de la marca) y los modelos alineados en estantes (el "shelf"). Tres motivos propios, repetidos en todo el producto:

1. **Escenario orbital**: suelo oscuro con sombra de contacto y un anillo elíptico violeta de 1 px que gira despacio o marca el ángulo de giro. Sustituye a la rejilla `.studio-floor`.
2. **Estante**: filas horizontales de modelos apoyados en una línea de luz, desplazables. Es la forma de galería propia (ni mosaico ni bento).
3. **Construcción**: malla → barro → textura. Es la transición de marca: hero, progreso real de un trabajo, paso del cursor en tarjetas.

Datos técnicos siempre en monoespaciada (`2.0M → 60K tris · 1.1 MB · GLB`): es lo que da aire de herramienta profesional.

### 3.1 Tokens (reemplazan los de `src/app/globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0b0b0e` | Fondo de página |
| `--surface-1` | `#131318` | Tarjetas, paneles |
| `--surface-2` | `#1b1b22` | Controles, hover |
| `--surface-3` | `#25252e` | Elementos elevados, menús |
| `--stage` | `#08080a` | Fondo de visor y miniaturas |
| `--line` / `--line-strong` | blanco 8 % / 16 % | Bordes |
| `--fg` / `--muted` / `--subtle` | `#f5f5f7` / `#a3a3ad` / `#74747e` | Texto (`--subtle` solo ≥14 px, comprobar 4,5:1) |
| `--accent` | `#a78bfa` | Texto y trazos de acento |
| `--accent-fill` | `#6d4dff` | Rellenos con texto blanco (≥4,5:1) |
| `--accent-grad` | `linear-gradient(135deg,#8f6bff,#5b3df5)` | Solo CTA primario y botón Generar |
| `--ok` / `--warn` / `--danger` | `#6fcf97` / `#f5b942` / `#ff7a7a` | Estados |
| Radios | 8, 12, 16, 24, píldora | Control, campo, tarjeta, panel, botón |
| Espaciado | base 4 px: 4, 8, 12, 16, 24, 32, 48, 72, 112 | Único |
| Sombras | 2 niveles, teñidas del fondo, sin negro puro | Menús y diálogos |
| Movimiento | 120 ms (micro), 220 ms (control), 420 ms (panel), 800 ms (escena); curvas `cubic-bezier(.2,.8,.2,1)` y resorte 300/30 | Único |

Renombrar `--blood` → `--accent-fill` en todo el código (hoy "blood" es violeta por historia). Verificar contraste de cada par con axe.

### 3.2 Tipografía (cambia: hoy Poppins coincide con Hyper3D)

| Rol | Fuente | Detalle |
|---|---|---|
| Display | **Sora** 600/700 | Títulos; `letter-spacing -0.03em`; hero `clamp(2.6rem,5.2vw,4.5rem)` |
| Texto | **Instrument Sans** variable (ya instalada) | Cuerpo 16/26, UI 14/20 |
| Datos | **JetBrains Mono** 400/500 | Créditos, triángulos, tamaños, estados, etiquetas en mayúsculas 12 px |

Instalar con `@fontsource/sora` y `@fontsource/jetbrains-mono`; cargar en `src/app/[locale]/layout.tsx` solo los pesos usados. Escala: 12, 14, 16, 18, 22, 28, 36, 48, 64, 72.

### 3.3 Kit de componentes (`src/components/ui/`, nuevo)

Sobre Radix + `cva` + `cn()` (`src/lib/utils.ts`). Añadir `@radix-ui/react-{tabs,tooltip,popover,select,slider,toggle-group,scroll-area}` y `sonner` (toasts).

`Button` (primary con degradado, secondary, ghost, danger; sm/md/lg; estado cargando), `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioCard`, `Slider`, `Segmented`, `Tabs`, `Chip`, `Badge` (ok/warn/muted/accent), `Card` (default/outline/feature/planned, reemplaza `Card` de `marketing-kit.tsx`), `Panel`, `Dialog`, `Sheet`, `DropdownMenu`, `Tooltip`, `Popover`, `Toast`, `Skeleton`, `EmptyState`, `PageHeader`, `DataTable`, `Stat` (número en mono + etiqueta), `SpecLine`, `Kbd`, `CreditCost` (icono + número, nunca "US$").

Componentes 3D (`src/components/model/`): `ModelStage` (escenario orbital), `ModelThumb` (miniatura de estudio con relación fija), `SpinViewer` (giro pre-renderizado arrastrable), `ModelShelf` (estante), `BuildReveal` (extraído de `hero-shelf.tsx`), `CompareSlider` y `Turntable` (mover desde `components/home/`), `ViewerToolbar`. `ModelViewerBox` se conserva como único visor vivo y gana estilo, sin cambiar sus `data-*`.

Página de control `src/app/[locale]/dev/kit/page.tsx` (solo en desarrollo, `notFound()` en producción) con todos los componentes y estados, para revisar a ojo y con axe.

## 4. Los modelos: inventario, optimización y uso

### 4.1 Inventario medido (cabeceras GLB leídas sin extraer)

33 modelos únicos: 29 nuevos más los 4 anteriores. Duplicados que se ignoran: `dfdd3521 (1)`, `fb365098 (1)`, `fcebda7b (1)`, `model (1).glb`, `model (2).glb`. Todos traen 3 texturas (color, normal, metal-rugosidad) salvo donde se indica. Proporciones normalizadas a 1,9 de lado mayor (ancho × alto × fondo).

| Grupo | Id (zip) | Triángulos | Partes | Proporción | Zip | Notas |
|---|---|---:|---:|---|---:|---|
| **A. Héroe (2 M)** | `9d8b403c` | 2.000.000 | 1 | 1,81×1,89×1,79 | 127 MB | Compacto |
| | `64c5bdd7` | 2.000.000 | 1 | 1,90×1,87×1,88 | 121 MB | Compacto |
| | `dfdd3521` | 2.000.000 | 1 | 1,90×1,52×1,77 | 178 MB | Ancho |
| | `c24ab0e5` | 2.000.000 | 1 | 1,40×1,89×0,96 | 118 MB | Vertical |
| | `d3e53c56` | 2.000.000 | 1 | 1,71×1,90×0,81 | 117 MB | Vertical ancho |
| | `9b749bdb` | 2.000.000 | 1 | 0,48×0,79×1,90 | 126 MB | Alargado |
| | `41676bd2` | 1.999.992 | 1 | 1,27×1,90×0,64 | 162 MB | **Mismas proporciones que el guerrero: revisar** |
| | `f8ae7234` | 1.999.994 | 1 | 1,91×1,62×1,83 | 134 MB | Dragón (ya en uso) |
| | `dcf3e0fd` (OBJ) | 1.999.996 | 1 | 1,85×1,90×0,70 | 203 MB | Hoodie (ya en uso) |
| | `8f71479d` (OBJ) | 1.600.000 | 1 | 1,90×1,85×0,54 | 165 MB | Cocina (ya en uso) |
| | `d99155df` | 1.999.998 | 1 | 1,25×1,90×0,64 | 144 MB | Guerrero: **excluido** |
| **B. 1 M** | `4fbe56d9` | 999.990 | 1 | 1,22×1,22×1,90 | 107 MB | Alargado |
| | `824e0e1c` | 999.972 | 1 | 1,25×1,89×1,35 | 94 MB | Vertical |
| **C. 500 k** | `0237e0b0` | 500.000 | 1 | 1,83×1,61×0,74 | 46 MB | |
| | `380eaea7` | 499.961 | 1 | 1,18×1,82×0,82 | 39 MB | Vertical |
| | `6200c066` | 500.000 | 1 | 1,29×1,82×1,90 | 58 MB | |
| | `a60f2e3c` | 499.918 | 1 | 1,02×1,78×0,94 | 39 MB | Vertical |
| | `7088689d` | 500.000 | 1 | 0,80×1,90×0,78 | 67 MB | Con textura emisiva |
| | `9a58e407` | 499.998 | 1 | 1,56×1,90×1,05 | 49 MB | Con textura emisiva |
| **D. Por partes** | `224688df` | 499.787 | 8 | 1,39×1,53×1,81 | 47 MB | |
| | `ddd737fb` | 500.000 | 8 | 1,06×1,90×0,61 | 46 MB | |
| | `26375c79` | 348.811 | 70 | 1,36×1,68×0,75 | 35 MB | |
| | `7850adb8` | 119.934 | 9 | 1,90×1,11×1,10 | 15 MB | |
| | `agentic_0005` (.glb) | 63.024 | 230 | 2,0×2,0×2,0 | 7 MB | 15 materiales con nombre ("Brushed steel hardware", "Accessory rail lug"): **revisar que no sea un arma** |
| **E. Low-poly** | `322f0e31` | 10.320 | 1 | 0,64×1,05×1,90 | 18 MB | |
| | `6028defa` | 10.242 | 1 | 1,90×1,15×1,89 | 14 MB | Emisiva |
| | `3155ce62` | 18.750 | 1 | 0,77×1,43×1,90 | 11 MB | |
| | `9ba1b1f1` | 19.338 | 1 | 1,37×1,51×1,87 | 13 MB | |
| | `bfda4d75` | 20.464 | 1 | 1,90×0,83×0,96 | 13 MB | |
| | `842cbef6` | 20.596 | 1 | 1,90×0,82×0,83 | 21 MB | |
| | `fb365098` | 34.972 | 1 | 0,24×1,47×1,90 | 8 MB | Muy delgado |
| | `fcebda7b` | 38.232 | 1 | 1,83×0,92×0,88 | 10 MB | |
| **F. Escultura** | `model.glb` | 4.788.680 | 1 | 0,63×0,99×1,90 | 82 MB | Sin materiales ni texturas (geometría pura) |

**Límite de este inventario:** el modo plan no permite extraer ni renderizar, así que **todavía no se sabe qué representa cada modelo nuevo**. La clasificación visual es el primer paso de la Fase 0, con veto del dueño.

### 4.2 Fase 0: hoja de contactos y clasificación

1. Extraer cada zip a `.art-cache/src/<id>/` (no va a git; ~5 GB; comprobar espacio en disco).
2. Ampliar `scripts/render-landing.py`: `MODELS` pasa a leerse de `.art-cache/models.json`; añadir `--what contact` (una toma a 512 px, 32 muestras, ~10 s por modelo).
3. Generar `docs/modelos/hoja-de-contactos.png` con id, triángulos y grupo bajo cada miniatura, y enviarla al dueño.
4. Clasificar cada modelo en `.art-cache/models.json`: `name`, `category` (apparel, furniture, product, character, creature, vehicle, prop, architecture, sculpture), `tags`, `hue` dominante, `yaw`, `key`, `rim`, y `status` (`use` / `review` / `exclude`).
5. **Reglas de exclusión:** personajes, marcas o diseños reconocibles de terceros; armas realistas; rostros de personas reales; contenido no apto para una marca de comercio. El dueño confirma la lista.
6. Medir texturas reales (lado en píxeles) y registrar.

### 4.3 Tubería de optimización (amplía `scripts/build-landing-art.ts`)

La reducción se hace en Blender (soldar vértices y `DECIMATE`), no con `optimizeGlb`: ya se comprobó que respeta las UV y llega al objetivo exacto donde el simplificador del producto se queda corto.

| Nivel | Triángulos | Texturas | Peso máx. | Uso |
|---|---:|---|---:|---|
| `hero` | 120.000 | 2K WebP | 4 MB | Visor del hero en escritorio con buena conexión |
| `web` | 60.000 | 1K WebP | 1,5 MB | Visor por defecto y móvil |
| `card` | 15.000 | 512 WebP | 350 KB | Vista rápida en galería |
| Original | — | — | — | Nunca se sirve |

- Grupo E se sirve casi tal cual: solo cuantización y texturas WebP.
- Grupo F: solo barro y malla (no tiene textura); `web` a 150.000 triángulos porque la forma es todo.
- Grupo D: se exporta unido para la web. La separación por partes no se muestra (regla 4).
- Compresión: `quantize()` + `textureCompress` WebP (extensión `EXT_texture_webp`), que el visor lee sin decodificador externo. Meshopt o KTX2 solo si un presupuesto no se cumple, y entonces alojando el decodificador en `public/vendor/`.
- Si al bajar a 60.000 se pierde relieve visible, hornear el mapa de normales del original sobre la malla reducida (Blender, "selected to active"). Solo en los modelos del hero.
- Selección de nivel en cliente: `navigator.connection.saveData`, `deviceMemory < 4` o ancho < 768 → `web`; si no, `hero`.

### 4.4 Arte por modelo

| Salida | Especificación | Destino |
|---|---|---|
| `beauty`, `alt` | Cycles 2000 px, RGBA, 192 muestras; WebP y AVIF a 1600/800/240 | Tarjetas, bento, navbar |
| `clay`, `wire` | Mismo encuadre que `beauty` | Comparador, construcción |
| `spin` | **48 cuadros a 720 px**, RGBA, en hoja de sprites WebP de 8×6 (≤1,2 MB) | `SpinViewer`: arrastrar para girar sin WebGL |
| `turn` | Video 96 cuadros, WebM + MP4 ≤500 KB | Solo hero secundario y cierre |
| `poster` | 800 px sobre `--stage` | Carga de visor y redes |

Iluminación única (tres puntos con borde violeta, ya definida) para que toda la galería parezca del mismo estudio. Ajuste `key`/`rim` por modelo según su color (negros ×2,5; madera cálida con borde ×0,15). Emisivos: añadir `Bloom` suave en el compositor de Blender y fondo más oscuro.

Arte completo (todo lo anterior) para ~12 modelos elegidos; el resto solo `beauty`, `spin` y `web`. Tiempo estimado con la RTX 4060: ~4 min por modelo completo, ~1 h en total.

Salida: `public/models/<slug>/…` y `src/content/models-manifest.json` (generado: slug, nombre en/es, alt en/es, categoría, etiquetas, triángulos original y web, bytes, rutas, dimensiones, color dominante). `src/content/landing-art.ts` pasa a leer del manifiesto. Presupuesto total de `public/models/`: ≤60 MB en git.

### 4.5 Asignación a secciones (por perfil; se confirma con la hoja de contactos)

| Lugar | Necesita | Candidatos por perfil |
|---|---|---|
| Hero (rotación de 4–5) | 2 M, silueta clara, colores distintos entre sí | Dragón + 4 del grupo A |
| Muro "estante" de la home (12–16) | Variedad de categorías | A, B, C |
| Bento "foto a 3D" | Producto de tienda | Hoodie + productos de C |
| Bento "texto a 3D" | Criatura o prop estilizado | Dragón, E |
| Secuencia de construcción (scroll) | Modelo con relieve y buen contraste malla/textura | Cocina o uno de A |
| Comparador textura/malla | Aristas limpias | Cocina, A |
| Soluciones · Tiendas | Ropa, mueble, producto | Hoodie, cocina, C |
| Soluciones · Juegos | Low-poly con visor vivo (pesan poco) | Grupo E completo |
| Soluciones · Diseño 3D e impresión | Geometría sin textura | Grupo F en barro |
| Visores vivos secundarios | <40.000 triángulos | Grupo E |
| Emisivos | Fondo muy oscuro, de noche | `7088689d`, `9a58e407`, `6028defa` en el cierre y en precios |
| Navbar, login, 404, estados vacíos | Miniaturas 240 px | Cualquiera clasificado `use` |
| Dashboard: fondo del compositor y estados vacíos | `beauty` atenuado | A |

La galería de ejemplos de la dashboard (`example-card-*`, 12 exactos, diálogo con "CC0") **no cambia de contenido**: son los modelos Poly Haven que el usuario puede importar con licencia CC0.

## 5. Movimiento e interacción

| Patrón | Dónde | Cómo |
|---|---|---|
| Construcción malla → barro → textura | Hero, primera carga de `ModelThumb`, trabajo en proceso | CSS `clip-path` (ya existe); en trabajos reales, cada capa corresponde a un estado real del trabajo |
| Giro al arrastrar | Tarjetas de estante, galería, biblioteca (solo modelos con `spin`) | `SpinViewer`: canvas 2D con hoja de sprites; inercia; teclas ← → ; carga al entrar en pantalla |
| Anillo orbital | `ModelStage` | SVG con `stroke-dashoffset` ligado al ángulo; giro lento en reposo |
| Secuencia fijada al scroll | Home §5 | `position: sticky` + `motion` `useScroll`; 5 pasos; sin secuestro del scroll |
| Elemento compartido | Tarjeta → estudio del modelo; miniatura → diálogo | `motion` `layoutId`; entre rutas, View Transitions si la versión instalada de Next lo soporta (comprobar en sus docs) |
| Resorte de entrada | Tarjetas, menús, diálogos | `motion`, 220–420 ms |
| Hover de tarjeta | Todas | Elevación 4 px, borde `--line-strong`, el modelo sube 8 px y escala 1,02 |
| Botón Generar | Compositor | Degradado con brillo que recorre al pasar; estado cargando real |
| Números | Créditos, métricas | Conteo breve al cambiar, en mono con `tabular-nums` |
| Texto que se escribe | Prompt de ejemplo | Ya existe (`typed-prompt.tsx`) |
| Esqueletos | Toda carga | Bloques con la forma final; nada de spinners sueltos |

Reglas: una sola animación protagonista por pantalla; nada se mueve en bucle salvo el anillo y los videos visibles; todo bucle se puede pausar; con movimiento reducido, todo aparece en su estado final.

## 6. Rediseño de marketing

### 6.1 Shell (`src/components/marketing-shell.tsx`)
- Píldora flotante con los nuevos tokens; logotipo con el anillo orbital.
- Mega menús con renders (hecho): pasan a `ModelThumb` sobre `--stage` y abren con resorte. Recursos mantiene panel de imagen.
- Pie: gran palabra "orbitshelf" en display tenue + columnas actuales (se conservan todos los enlaces, el test 7v los comprueba).

### 6.2 Home (`src/app/[locale]/page.tsx`), de ~12.300 px a ~9.000 px

| # | Sección | Contenido |
|---|---|---|
| 1 | **Hero** | Izquierda: título, una línea, y **compositor real**: campo de descripción o subir foto + botón Generar que lleva a `/dashboard/create` con lo escrito (ampliar `src/lib/composer-handoff.ts` con `sessionStorage` para sobrevivir al login). Derecha: `ModelStage` con construcción y visor vivo al tocar (ya existe), anillo orbital, línea de datos en mono. Se conserva `hero-model-viewer`, el arrastre y el H1 |
| 2 | Tira "Files ready for" | La actual, con nueva tipografía |
| 3 | **Estante de modelos** | 12–16 modelos en 2 filas desplazables con `SpinViewer`; chips de categoría que filtran; clic abre vista rápida (diálogo con visor vivo nivel `card`→`web`). Título neutro ("See what you can build"), sin autores ni contadores |
| 4 | Tres formas de empezar | Bento actual, rehecho con el kit |
| 5 | **Del original al archivo listo** (fijada al scroll) | Un modelo pasa por: foto → malla → barro → textura → optimizado (cifras reales del manifiesto) → formatos de exportación. Sustituye "Tres pasos" y el comparador grande |
| 6 | Control | Fila de 4: lista de revisión, métricas reales, versiones, exportación. Comparador textura/malla más pequeño al lado |
| 7 | A quién ayudamos | Pestañas Tiendas / Juegos / Diseño: cambia modelo, texto y enlace |
| 8 | Integraciones | Fila de logos (`brand-icons.tsx`) + estado real de cada una |
| 9 | Qué esperar + FAQ | Dos columnas: límites honestos y preguntas |
| 10 | Cierre | Modelo emisivo girando sobre el escenario, título y CTA |

Se retiran de la home (siguen en sus páginas): `ProductFit` → `/how-it-works`; `WorkflowVersus` → `/compare/ai-3d-vs-manual`; `TrustStrip` → `/legal` y pie. El test 7w exige que la home no muestre precios.

### 6.3 Páginas internas

| Página | Rediseño |
|---|---|
| `features` y `features/[slug]` | Hero con `ModelStage` propio de la función; demostración de entrada → salida con modelo del manifiesto; ficha técnica en mono; estante de 4 modelos relacionados |
| `solutions` y `solutions/[slug]` | Hero con modelo de la categoría (ropa/mueble; low-poly con visor vivo; escultura en barro); flujo en 3 pasos con imágenes; lista de comprobación |
| `how-it-works` | La secuencia fijada de la home, ampliada a 6 pasos, + `ProductFit` |
| `examples` | Se mantiene su contrato (muestras demo CC0 interactivas). Nueva rejilla `ModelThumb`; visor en diálogo |
| `pricing` | Tarjetas de plan con el kit, sliders con marca (conservar `plan-*-slider`, `-price`, `-credits`); tabla "modelos por plan" en mono; modelo emisivo de fondo atenuado. La calculadora no muestra nombres de motores (test) |
| `integrations` | Rejilla de mosaicos de marca con estado; diagrama de flujo simple |
| `compare/ai-3d-vs-manual` | Tabla comparativa + `WorkflowVersus` |
| `resources`, `resources/[slug]`, `blog`, `blog/[slug]` | Plantilla editorial: columna de 68 caracteres, Instrument Sans 18/30, portada con render, índice lateral en escritorio |
| `legal`, `legal/[slug]`, `privacy`, `terms` | Plantilla de documento sobria, sin arte |
| `login` | Pantalla partida: formulario a la izquierda (`#login-email`, `login-submit`), `ModelStage` con giro a la derecha (oculto en móvil) |
| `not-found` | Modelo en malla + enlace a inicio |
| Visor público (`app/embed/[token]/route.ts`) | Nueva plantilla HTML: fondo `--stage`, cargador con anillo orbital, póster, marca discreta. Respetar su CSP |

## 7. Rediseño de la dashboard

### 7.1 Shell (`src/components/dashboard-shell.tsx`)
- **Riel lateral** de 72 px (iconos + etiqueta corta), ampliable a 232 px: Create, Models, Explore, Connections, Agents. Abajo: Help y Settings. Justificación: es el patrón de las herramientas creativas, libera altura para el visor y deja crecer el menú.
- **Barra superior** de 56 px: selector de espacio de trabajo (se mueve aquí desde la página de inicio, conservando `workspace-select`), buscador global, píldora de modo (`provider-mode-pill`), créditos (`credit-chip`, su texto debe seguir siendo el saldo exacto), idioma, cuenta (`account-menu-btn`, `#account-menu`, Enter abre, Escape lo quita del DOM).
- Móvil: barra inferior de 5 destinos + cajón `#mobile-dashboard-drawer`.
- `src/app/[locale]/dashboard/loading.tsx` y `error.tsx` nuevos, con esqueleto del shell.

### 7.2 Crear: inicio (`dashboard/page.tsx`, `studio-composer.tsx`) y `/create` (`create-wizard.tsx`)
- **Inicio = lienzo de creación.** Compositor centrado sobre `ModelStage` (referencia: Hyper3D). Fila de chips bajo el campo: tipo de entrada, modelo (`model-picker-toggle` con "Automatic"), calidad, costo en créditos. Botón Generar con el degradado.
- Debajo, pestañas: **Recent** (últimos modelos con estado real), **Examples** (los 12 CC0, mismos testids) y atajos del espacio de trabajo (`workspace-shortcuts`). La tarjeta de primer modelo (`first-model-card`, `first-model-progress`, `data-step`) y el onboarding (`onboarding-card`, `profile-*`) pasan a una franja compacta descartable. Se conserva `stat-total-models`.
- **`/create` = espacio de trabajo de 3 zonas** (hoy formulario de 12 columnas):
  - Izquierda (320 px): fuente como `RadioCard` (`source-*-radio`), ranuras de foto con vista previa (`create-photo-input*`), GLB (`create-glb-input`), descripción (`create-prompt-input`), datos del producto.
  - Centro: escenario con `create-preview-viewer`, o la foto subida, o la construcción.
  - Derecha (340 px, pegajosa): preajustes (`preset-radio-*`), motor (**mantener un `<select>` nativo** con `create-engine-select` y sus `<option>`, estilizado), calidad, costo (`create-cost-text`, sin "US$"), casillas (`confirm-paid-checkbox`, `confirm-rights-checkbox`), error (`create-error-alert`), enviar (`create-submit-btn`).
  - Móvil: las tres zonas se apilan; la barra de costo y enviar queda fija abajo.
- **Trabajo en proceso:** escenario con construcción ligada al estado real (en cola → malla; generando → barro; texturizando → textura), tiempo transcurrido en mono y `refresh-job-btn`. Sin porcentajes inventados.

### 7.3 Biblioteca (`models/library-client.tsx`, `trash-client.tsx`)
- Barra de herramientas: buscador (`library-search`), filtros como chips con `Popover` (estado, origen, revisión, proyecto `library-filter-project`, etiqueta `library-filter-tag`), favoritos, vista rejilla/lista, exportar CSV, papelera.
- Rejilla de `ModelThumb` 1:1 sobre `--stage` (4 columnas en ≥1280, 3, 2, 1). Cada tarjeta (`model-card-{id}`): miniatura, título, insignias de estado y revisión, favorito, y acciones al pasar (abrir, descargar, borrar `delete-model-{id}`).
- Estados vacío y sin resultados con `EmptyState` y un modelo en malla. Diálogo de borrado con Radix (`confirm-delete-model`).
- Papelera con la misma rejilla (`trash-restore-*`, `trash-purge-*`, `trash-empty`).

### 7.4 Estudio del modelo (`models/[id]/studio-client.tsx`, `asset-tools.tsx`)
- **Visor dominante** a la izquierda (alto de ventana menos cabecera, pegajoso). `ViewerToolbar` flotante: textura / malla (`studio-viewer-wireframe`), giro automático (botones con nombre exacto "Auto-rotate" y "Stop rotating" y `aria-pressed`), restablecer, captura (ya existe `onReady` con `toBlob`), pantalla completa, fondo claro/oscuro.
- **Inspector** a la derecha (400 px) con **secciones plegables todas presentes en el DOM y abiertas por defecto** (así los e2e no cambian): Review (`checklist-*`, nota, aprobar), Details (proyecto, etiquetas, `save-meta-btn`), Mesh (`tools-metrics`, avisos), Optimize & versions (`optimize-store-btn`, `version-*`, `compare-*`, `use-version-*`), Export (GLB/OBJ/STL), Publish (`shopify-*`), Source (fotos `studio-source-photo*`, `studio-prompt`, `studio-engine`), History.
- Cabecera: título (`studio-title`), insignias, descargar, menú de más acciones.
- Paneles de proceso y fallo (`job-failed-panel`) con el kit. Móvil: visor arriba (50 % de alto), inspector debajo.

### 7.5 Resto

| Pantalla | Rediseño |
|---|---|
| `explore` | Mosaicos de herramienta con miniatura (`explore-tool-*`); tabla de motores como `DataTable` con nivel, entradas, formatos, créditos y estado (`explore-engine-status-*`: "Available" / "Not available yet") |
| `connections` | Mosaicos de marca por categoría con anillo de estado (`connection-*` con `data-state`) |
| `embeds` | Dos columnas: formulario (`embed-domains-input`, `embed-create-btn`) y vista previa del visor; fragmento en bloque de código con copiar (`embed-snippet`) |
| `api` (MCP, API, Webhooks) | `Tabs` del kit; bloques de código con copiar; token mostrado una vez con aviso; `DataTable` de entregas. Conservar todos los `token-*`, `webhook-*`, `mcp-*` |
| `billing` | Tarjetas de plan y calculadora como en `/pricing`; `CheckoutPanel` con el kit |
| `usage` | `Stat` de saldo y consumo + `DataTable` |
| `settings` | Secciones con `Panel`; `ShopifyConnect` (`shopify-shop-input`, `shopify-connect`, `shopify-connected`) |
| `help` | Tarjetas de guía + enlaces |
| `admin/*` | `PageHeader`, `Stat`, `DataTable` (`admin-workspaces`, `admin-workspace-detail`, `admin-detail-balance`) |

## 8. Arquitectura frontend, responsive y rendimiento

**Dependencias nuevas:** `motion`, `sonner`, paquetes Radix citados, `@fontsource/sora`, `@fontsource/jetbrains-mono`. **No** se añaden `three`/`@react-three/fiber`, GSAP ni Lenis: el realismo sale del render de Blender y de la secuencia de giro, que cuestan menos y se ven mejor que una escena WebGL en vivo. Si más adelante se quiere una escena 3D propia en el hero, es una fase aparte.

**Estructura:**
```
src/components/ui/        kit (cliente solo donde hay estado)
src/components/model/     ModelStage, ModelThumb, SpinViewer, ModelShelf, BuildReveal, CompareSlider, Turntable, ViewerToolbar
src/components/marketing/ secciones de páginas públicas (mover home/* y landing-extra)
src/components/app/       shell y piezas de dashboard
src/content/models-manifest.json   generado
src/lib/models.ts         acceso tipado al manifiesto y elección de nivel
```
Server Components por defecto; `"use client"` solo en hojas interactivas. `motion` con `LazyMotion` + `m` y `domAnimation`.

**Responsive:** puntos 640, 768, 1024, 1280, 1536. Marketing con contenedor de 1200 px; dashboard fluida. En táctil no hay hover: el giro se activa al tocar y las acciones de tarjeta están siempre visibles. Objetivos táctiles ≥44 px.

**Presupuestos (se miden en la Fase 8; build de producción, móvil medio, 4G):**

| Métrica | Límite |
|---|---|
| LCP home | ≤2,5 s |
| CLS | ≤0,05 |
| INP | ≤200 ms |
| Imagen LCP del hero | ≤150 KB (AVIF) |
| Transferencia inicial de la home | ≤900 KB |
| Home completa con scroll | ≤6 MB |
| JS añadido a marketing | ≤60 KB gzip |
| Contextos WebGL por página | 1 |
| Lighthouse móvil (rendimiento / accesibilidad) | ≥85 / ≥95 |

Técnicas: `<picture>` AVIF + WebP con `srcset`; `loading="lazy"` y `content-visibility: auto` bajo el primer pliegue; hojas de giro y videos solo al entrar en pantalla y nunca en `saveData`; `preload` solo de la imagen LCP y de las fuentes del primer pliegue; el visor vivo se monta al primer gesto.

## 9. Fases, archivos y criterios de aceptación

Cada fase termina con: `npx tsc --noEmit`, `npx eslint .`, `npm test`, `npm run build`, `npx playwright test` en verde, y capturas a 1440, 1280, 768 y 390 px enviadas al dueño. Parar el servidor de desarrollo antes de `build` y e2e.

| Fase | Trabajo | Archivos principales | Aceptación verificable |
|---|---|---|---|
| **0. Recursos** | Copiar plan a `docs/`. Extraer zips. Hoja de contactos. Clasificar. Veto del dueño. Referencias a `docs/referencias/` | `scripts/render-landing.py`, `.art-cache/models.json`, `docs/modelos/` | Hoja con los 33 modelos; `models.json` con categoría y estado de cada uno; lista de excluidos confirmada por el dueño |
| **1. Sistema** | Tokens, fuentes, kit `ui/`, primitivas de movimiento, página `/dev/kit`, toasts, renombrar `--blood` | `globals.css`, `[locale]/layout.tsx`, `components/ui/*`, `package.json` | `/dev/kit` muestra cada componente en todos sus estados; axe sin faltas; ningún color fuera de tokens (`grep` de `#` en `src/components` solo en tokens y arte); e2e sigue en verde sin tocar pruebas |
| **2. Tubería de arte** | Niveles `hero/web/card`, renders, hojas de giro, manifiesto, `SpinViewer`, `ModelThumb`, `ModelStage` | `scripts/render-landing.py`, `scripts/build-landing-art.ts`, `public/models/`, `src/content/models-manifest.json`, `components/model/*` | Cada modelo `use` tiene `beauty`, `spin` y `web` dentro de presupuesto (el script falla si no); cada `web.glb` carga en el visor (Playwright); `public/models` ≤60 MB; giro con teclado |
| **3. Home y shell público** | §6.1 y §6.2 | `marketing-shell.tsx`, `[locale]/page.tsx`, `components/marketing/*`, `i18n/dictionaries/*`, `lib/composer-handoff.ts` | Tests 1, 7w, 7v, 8 y 12 en verde; home ≤9.500 px a 1440; un solo `model-viewer`; presupuestos de §8 en la home; el compositor del hero llega a `/create` con el texto escrito |
| **4. Páginas públicas** | §6.3, login, 404, visor público | `features/*`, `solutions/*`, `how-it-works`, `examples`, `pricing`, `integrations`, `compare`, `resources/*`, `blog/*`, `legal/*`, `login/*`, `not-found.tsx`, `app/embed/[token]/route.ts` | Las 31 rutas del test 8 pasan (un H1, axe, sin desborde a 375, sin texto <12 px); visor público carga un modelo aprobado y respeta su CSP (test 6e) |
| **5. Shell de app y Crear** | §7.1 y §7.2 | `dashboard-shell.tsx`, `dashboard/layout.tsx`, `dashboard/page.tsx`, `studio-composer.tsx`, `model-picker.tsx`, `create/create-wizard.tsx`, `loading.tsx`, `error.tsx` | Tests 3, 5, 6, 6b, 6d, 7, 9 y 11 en verde sin cambiar testids; navegación completa por teclado; `credit-chip` igual al saldo; esqueleto visible con red lenta |
| **6. Biblioteca y estudio** | §7.3 y §7.4 | `models/library-client.tsx`, `models/trash/*`, `models/[id]/studio-client.tsx`, `asset-tools.tsx`, `ShopifyPublish` | Tests 3, 4, 6c, 6e y 6f en verde; el visor ocupa ≥60 % del ancho a 1440; todas las secciones del inspector en el DOM |
| **7. Resto de la app** | §7.5 | `explore`, `connections`, `embeds`, `api/*`, `billing`, `usage`, `settings`, `help`, `admin/*` | Tests 6g, 7y, 7z, 9 y 10 en verde; ninguna pantalla con clases de botón o tarjeta fuera del kit |
| **8. Pulido** | Medir presupuestos, móvil real, Safari y Firefox, movimiento reducido, capturas de regresión, limpiar CSS y componentes muertos, actualizar `docs/screenshots/` | Todo | Tabla de §8 cumplida y medida con Lighthouse; nueva prueba e2e de regresión visual de home, crear, biblioteca y estudio; sin `console.error` en ninguna ruta |

### 9.1 Orden y dependencias
0 → 1 → 2 son secuenciales. Después, 3–4 (marketing) y 5–7 (app) pueden ir en paralelo en sesiones separadas, porque no comparten archivos salvo `globals.css` y `components/ui` (congelados tras la Fase 1). La 8 va al final.

### 9.2 Reutilizar (ya existe y funciona)
`scripts/render-landing.py` (luz, cámara, barro, malla, giro, reducción en Blender), `scripts/build-landing-art.ts` (recorte, difuminado de bordes, WebP, video, GLB web), `src/components/home/*` (`art-image`, `compare-slider`, `turntable`, `typed-prompt`, `marquee`, `hero-shelf`, `use-in-view`), `src/components/model-viewer-box.tsx`, `src/content/landing-art.ts`, `src/lib/composer-handoff.ts`, `src/lib/utils.ts` (`cn`), `src/components/brand-icons.tsx`, y las clases `.pill-nav`, `.mega-panel`, `.reveal`.

### 9.3 Contrato de pruebas
La lista completa de `data-testid` y textos está en `tests/e2e/app.spec.ts` (agrupada por pantalla en la auditoría: login, shell, inicio, selector de modelos, crear, estudio, biblioteca, embeds, explorar, conexiones, ajustes, API, facturación, admin). Regla: se puede cambiar la estructura y el estilo de cualquier elemento, **no** su `data-testid`, su rol, ni los textos comprobados ("Automatic", "N credits", "Auto-rotate", "Stop rotating", "In use", "Published", "Available", "Not available yet", "Starter (200)", "CC0"). `create-engine-select` debe seguir siendo un `<select>`.

## 10. Decisiones tomadas por defecto (el dueño puede cambiarlas)

1. **Color:** se mantiene el violeta como único acento; el fondo pasa a grafito neutro.
2. **Tipografías:** Sora + Instrument Sans + JetBrains Mono, para dejar de coincidir con Hyper3D.
3. **Dashboard con riel lateral** en vez de solo barra superior.
4. **Sin WebGL propio** (three/R3F): render de Blender + giro pre-renderizado + un visor vivo.
5. **El guerrero sigue excluido**, y `41676bd2` también si resulta ser el mismo personaje.
6. **Los modelos por partes se muestran unidos**: OrbitShelf no edita por partes.

7. **Todos los modelos se usan** (decisión del dueño, 2026-11-12), salvo el guerrero. Los de Shopify (`d3e53c56`), Unity (`64c5bdd7`) y Blender (`fb365098`) van en la sección de conexiones de la home y de `/integrations`, como destinos que leen los archivos. Roblox Studio, impresión directa y otras conexiones futuras se muestran como "próximamente".
8. **Peso de la landing:** los GLB originales nunca se sirven. Tres presentaciones: renders (portadas, tarjetas, menús, fondos), giros pre-renderizados arrastrables (`SpinViewer`) y un único visor 3D vivo por pantalla, que se monta solo al interactuar.

## 11. Fuera de alcance

- Arreglar el optimizador del producto (tarea aparte, recomendada antes de lanzar).
- Control de detalle, textura 4K y refinamiento progresivo (dependen de motores encendidos).
- Encender motores o gastar en ellos. La comparativa de US$10 sigue aparte.
- Cambiar nombre o logotipo definitivos (el nombre es provisional).

## Fase 2 — resultado y desviaciones (2026-11-12)

Hecho: 32 modelos (todos los entregados salvo el guerrero) con `beauty` 1600/800/240, `poster`, `spin`, `web.glb` y `card.glb` en `public/models/<slug>/`, manifiesto `src/content/models-manifest.json`, componentes `ModelThumb`, `ModelStage`, `SpinViewer`, página de control `/dev/models`, prueba `tests/unit/models-manifest.test.ts` y `scripts/check-model-viewers.mjs` (abre cada `web.glb` y `card.glb` en el visor vivo: 64 de 64 listos).

Desviaciones respecto al plan:
- **Niveles GLB:** `web` 50.000 triángulos (plan: 60.000) y `card` 12.000 (plan: 15.000), para caber en el presupuesto. Dos modelos con más textura usan `card` de 8.000 y 5.500. No se hizo el nivel `hero` (120.000): solo hace falta si la Fase 3 lo pide.
- **Giro:** 36 cuadros a 512 px en hoja de 6×6 (plan: 48 a 720 px en 8×6). Pesa 0,5–0,9 MB por modelo.
- **Presupuesto total de `public/models`:** 64 MB (plan: 60 MB). Resultado medido: 61,0 MB. Desglose: web.glb 38,9 MB, giros 18,7 MB, card.glb ~9,7 MB, renders 5,0 MB.
- **Escultura sin textura:** `web` a 60.000 triángulos con sombreado suave (plan: 150.000). Con sombreado plano cada triángulo exporta tres vértices y pesaba 12 MB; ahora 1 MB.
- **Arte completo** (clay, wire, turn, alt) solo para dragón, hoodie y cocina; el resto de los ~12 previstos se hace cuando la sección que los usa lo pida (Fase 3).
- Los modelos de conexiones (Shopify `d3e53c56`, Unity `64c5bdd7`, Blender `fb365098`) están en el manifiesto con `role: "integration"` y quedan fuera de `galleryModels`.

## Fase 3 — primera versión (2026-11-12) — REEMPLAZADA por la Fase 3b de más abajo

Hecho: la home nueva con las diez secciones de §6.2 y el shell público restilizado. Hero con compositor real (`HeroComposer`), estante de 16 modelos con chips de categoría y vista rápida (`ModelShelf`), bento de tres formas de empezar, secuencia fijada al scroll en seis pasos (`BuildSequence`), control (comparador + fila de cuatro tarjetas), pestañas por público (`AudienceTabs`), conexiones (`ConnectionsBand`, con los tres modelos de integración y Roblox Studio / impresión directa como "próximamente"), esperar + FAQ en dos columnas y cierre con el golem de cristal. Pie con la palabra grande tenue. `ProductFit`, `WorkflowVersus` y `TrustStrip` ya no están en la home.

Medido (build de producción, `next start`):
- Altura de la home a 1440 px: 9.433 (EN) y 9.486 (ES). Meta ≤9.500. A 1280: 9.417. A 768: 11.809. A 390: 15.002 (no había meta móvil).
- Un solo `model-viewer` en la página. Sin desborde horizontal a 375/390 px.
- Transferencia al evento `load`: 903 KB en escritorio, 764 KB en móvil (meta ≤900 KB; escritorio queda 3 KB por encima). Con el visor del hero ya montado: 2,1 MB. Home entera con scroll: 3,4 MB (meta ≤6 MB).
- Imagen candidata a LCP del hero (`dragon/beauty-800.webp`): 56 KB (meta ≤150 KB).
- JS al `load`: unos 270 KB comprimidos. La meta "≤60 KB añadidos a marketing" no se pudo comprobar contra la línea base anterior; queda para la Fase 8 con Lighthouse.
- Pruebas: tsc, eslint, 344 unitarias y 22 e2e en verde (incluidas 1, 7w, 7v, 8 y 12).

Desviaciones:
- **Visor del hero diferido.** El plan decía "se monta al primer gesto"; las pruebas 1 y 12 exigen `data-status="ready"` sin tocar nada. Se montó al quedar el navegador ocioso tras `load` (máximo 2,5 s) y solo con el primer toque si el usuario pidió ahorrar datos. Así la imagen del hero pinta sin esperar a 1,2 MB (script + GLB).
- **La vista rápida del estante no tiene visor vivo**: usa el giro pre-renderizado (`SpinViewer`). La regla de un único visor vivo por pantalla manda y el hero ya lo tiene.
- **Compositor del hero**: el botón dice "Start" / "Empezar". Una visita sin sesión pasa por `/login?next=…` y vuelve a `/dashboard/create` con el texto o la foto. El texto escrito llega como nombre del producto; mientras ningún motor esté encendido, el asistente ofrece la muestra de demostración, y el texto sigue en el traspaso para cuando haya motor. En modo enlace mágico (Supabase) el `next` no sobrevive al correo: pendiente al activar esa autenticación.
- **Bento**: se retiraron de la home las tarjetas "Sin datos de ubicación" y "Sin barras inventadas" (siguen en el diccionario). La tarjeta de métricas muestra cuatro de las ocho etiquetas.
- **Prueba 12 editada a propósito**: los patrones de imagen pasan a `main img[src*="/landing/"], main img[src*="/models/"]` (≥8) y `#menu-product img[src*="/models/"]` (4), porque las imágenes de la home y del menú ahora salen de `/models/`.
- **Pie**: la palabra grande se dibuja con CSS (`.footer-word::before`), no como texto; como texto, axe la marcaba por contraste aunque fuera decorativa.
- `Section` (marketing-kit) pasa a `py-12 md:py-16` y `space-y-8`: afecta a todas las páginas públicas, que se revisan en la Fase 4.
- **Mapa estático del menú**: `src/content/nav-art.ts` se genera del manifiesto (el shell es cliente y no puede importar el manifiesto entero).
- Pendiente para la Fase 8: `/favicon.ico` da 404 en todas las rutas (único `console.error` que queda) y las cuatro imágenes bajo el pliegue que no cargan en diferido.

## Fase 3b — home rehecha como Hyper3D, solo renders (2026-11-12)

El dueño rechazó la primera versión: no quería modelos 3D vivos ni el estante con "All" en la home (eso es de la dashboard), quería el estilo de Hyper3D con renders como imágenes en todo, y vio un mismo mueble repetido unas cinco veces. La Fase 3 de arriba queda reemplazada por esto.

Hecho:
- **Home sin visor vivo.** Cero `model-viewer`; solo imágenes (`ArtImage`). El hero es `HeroArt`: el dragón que se construye (malla, barro, textura) con dos tarjetas flotantes (personaje voxel y mech naranja).
- **Estante a la dashboard.** `ModelShelf` (16 modelos, chips por categoría, vista rápida con giro pre-renderizado) vive ahora en `dashboard/page.tsx`, bajo los ejemplos. `HeroShelf`, `AudienceTabs` y `ClosingStage` se borraron.
- **Un modelo, un lugar.** Hero: dragón + voxel + mech naranja. Tres formas de empezar: chaqueta azul (foto), lagarto (texto, con su propia descripción de ejemplo) y sofá de tela (varias fotos). Cómo funciona (`HowCards`, tres tarjetas): chaleco naranja, **la cocina solo aquí** (malla/barro/textura), T-rex. Comparador: la sudadera. Cuatro usos (`AudienceTiles`, tres renders cada uno): tiendas (sudadera con cremallera, sofá tapizado, bolsa de dinero), juegos (personaje voxel, cabaña de piedra, dragón morado), cine y animación (mech blanco, mech caminante, dragón rojo; los robots gigantes) y diseño 3D e impresión (gadget de geometría, dispositivo de 230 partes, perro robot). Cierre: golem de cristal.
- Textos nuevos en `home-copy.ts` (EN y ES): `textPrompt` y `uses`; `sequence.sub` ajustado.
- `HeroComposer` recibe `signedIn` y arma él mismo `/login?next=…`.
- `model-shelf.tsx`: se quitaron los márgenes negativos que desbordaban 4 px a 375 px dentro de la dashboard.
- `BuildSequence` (secuencia fijada al scroll) ya no está en la home; se reutiliza en `/how-it-works` (Fase 4).

Medido (dev server): home a 1440 = 7.936 px; sin desborde a 1440, 768 y 390 (390 = 14.804 px). Sin visor vivo, la transferencia inicial baja respecto a la Fase 3 (no se re-midió; entra en la Fase 8 con Lighthouse). Pruebas: tsc, eslint, 344 unitarias y 22 e2e en verde.

Pruebas editadas a propósito (todas en `tests/e2e/app.spec.ts`):
- **1**: afirma `hero-build` visible, última imagen cargada y `model-viewer` = 0 (antes esperaba el visor `ready` y el arrastre).
- **12**: pasa a "renders only with no live viewer"; `hero-build` visible y `model-viewer` = 0, más los patrones de imagen de la Fase 3.

Pendiente heredado: favicon 404 y carga diferida de imágenes bajo el pliegue (Fase 8).

## Fase 4 — páginas públicas con renders (2026-11-12)

Hecho, en el mismo estilo de la home (solo renders, un modelo distinto por lugar):
- **Piezas nuevas** (`src/components/marketing/model-art.tsx`): `ModelPile` (tres renders bajo el título), `ModelTrio` (imagen de tarjeta; la usan las tarjetas de uso de la home y de /solutions), `ModelRail` (fila de cuatro renders con nombre y triángulos en mono), `ModelCover` (portada de artículo) y `ModelRender` (render decorativo dentro de diagramas). `src/content/page-models.ts` fija qué modelo va en cada página y falla en el build si un slug no existe.
- **Dibujos planos retirados.** Los jarrones, lámparas y sillas de `FlowDiagram`, `HeroFlow` y `FeatureBento` (con el rojo antiguo) ahora son renders reales. `model-silhouette.tsx` queda sin uso (se borra en la Fase 8).
- **/features y /features/[slug]**: pila de tres renders en el héroe, flujo con render y fila "Modelos como estos" (una distinta por modo).
- **/solutions y /solutions/[slug]**: tarjetas con tres renders (tres tarjetas iguales en lugar de 3/2/5), héroe con pila + flujo, y fila de modelos por oficio (tiendas, juegos con los robots y la cabaña, diseño 3D).
- **/how-it-works**: pila en el héroe y la secuencia fijada al scroll de seis pasos (`BuildSequence`, con la cocina y cifras medidas de su archivo) antes de las cinco tarjetas.
- **/examples, /compare, /resources, /pricing, /integrations**: pila o fila de renders. /integrations usa el render del bolso (Shopify) y el logo de Blender en sus tarjetas. /pricing: fila de renders antes de las preguntas.
- **Blog y guías**: portada con render (estable por slug) en cada artículo y render pequeño en cada tarjeta del índice.
- **Login**: pantalla partida; formulario a la izquierda y el golem de cristal a la derecha (oculto bajo 1024 px). **404**: el lagarto en lugar del número con trazo; se cambiaron `[locale]/not-found.tsx` y `global-not-found.tsx`.
- **Visor público** (`/embed/[token]`): anillo orbital mientras carga (CSS, sin script, respeta la CSP) y fondo transparente como antes, porque va dentro de la página del cliente.

Sin pruebas editadas en esta fase. tsc, eslint, 344 unitarias, build y 22 e2e en verde (la 8 revisa las 31 rutas a 1280 y 375 px: axe, sin desborde, sin texto menor de 12 px).

Pendiente: `legal/*`, `privacy` y `terms` quedan con su plantilla actual (sobria, sin arte, como pedía el plan); /examples sigue con sus muestras demo en visor; borrar `model-silhouette.tsx` y medir pesos en la Fase 8.

## Fase 4b — páginas públicas con más color, renders y movimiento (2026-11-12)

El dueño pidió que las páginas de la Fase 4 se vieran menos vacías: más render, más color, estilo Hyper3D, más animación.

- **Tonos por página** (`src/content/tones.ts`, `<MarketingShell tone>`): violeta, cian, magenta, ámbar, esmeralda, azul. Cada página fija un par de colores (`--ta`, `--tb`) y de ahí salen la aurora, los lavados de color entre secciones, el tinte de las tarjetas y el brillo al pasar el cursor.
- **Héroe** (`PageHero`): aurora que se mueve, campo de puntos y estrellas, entrada escalonada del texto. `ModelPile` pasa a cinco renders (tres con alt y dos lejanos decorativos) sobre una órbita con puntos que giran, cada uno flotando a su ritmo, y chips con cifras reales del modelo principal.
- **Marquesinas** (`RenderMarquee`): dos filas de renders en sentido contrario bajo el héroe, cada tile con el color de su categoría. Decorativas (aria-hidden), orden propio por página (semilla).
- **Modelo destacado** (`ModelSpotlight`): un modelo grande con órbita y tres cifras medidas del manifiesto (triángulos originales, para web, peso del archivo). Un modelo distinto por página (`SPOTLIGHT` en `page-models.ts`).
- **Tarjetas con arte** (`Card art`, `TipCard art`): un render que sale de la esquina, solo desde 768 px y con el texto apartado. `ClosingBanner art`: dos renders en las esquinas del cierre.
- `ModelRail` y `ModelCover` con charco de color por categoría. Legal sigue sobrio (`PageHero calm`).
- Sin cambios en pruebas. tsc, eslint, 344 unitarias, build y 22 e2e (incluida la 8: axe, un H1, sin desborde a 375, sin texto <12 px en 31 rutas) en verde.
- Pendiente para la Fase 8: medir el peso añadido por las marquesinas (28 miniaturas de 240 px por página) y pausarlas fuera de pantalla.

## Fase 5 (parcial): shell de app y Crear

Hecho:
- `dashboard-shell.tsx`: riel lateral (72 px, ampliable a 232 px), barra superior de 56 px (espacio de trabajo `workspace-select`, buscador hacia `/dashboard/models?q=`, `provider-mode-pill`, `credit-chip`, idioma, cuenta) y barra inferior de 5 destinos en móvil más el cajón `#mobile-dashboard-drawer`.
- `dashboard/layout.tsx` pasa el espacio de trabajo activo; se retiró el selector duplicado de la página de inicio.
- Biblioteca: acepta `?q=`.
- `loading.tsx` (esqueleto, en cada sección menos `admin`, porque un 404 no puede enviarse con la página ya en streaming) y `error.tsx` del dashboard.
- `/create`: escenario grande a la izquierda (visor `create-preview-viewer` sobre aurora) y panel de controles pegajoso de 400 px a la derecha; en móvil el formulario va primero.

Pendiente: inicio como lienzo de creación (franja de recientes, onboarding compacto), `/create` en 3 zonas reales, barra fija de costo y envío en móvil.

Verificación: tsc y eslint limpios; build correcto; 22/22 e2e. Capturas en `docs/screenshots/fase5/`.

### Fase 5, segunda parte
- Inicio del dashboard: el compositor va sobre un lienzo con aurora violeta; el onboarding queda en una tarjeta más compacta. Las tarjetas de recientes (galería), la tarjeta de primer modelo, atajos y estante se conservan.
- Crear: botón de envío fijo sobre la barra inferior en móvil.
- Pendiente: Crear en 3 zonas reales (hoy son 2: escenario y panel).
- Verificación: tsc, eslint, build y 22/22 e2e en verde.

## Fase 6 (parcial): biblioteca y estudio

Hecho:
- Biblioteca: tarjetas tipo muro de medios (miniatura 1:1 sobre `--stage`, póster de la muestra si no hay miniatura propia, marcador si no hay ninguna), 4 columnas desde 1536 px, hover con elevación y zoom suave, paneles de filtros con la nueva superficie. Se conservan todos los `data-testid`.
- Estudio: el visor pasa a ocupar el ancho restante (~66 % a 1440 px) y es más alto; el inspector queda en 400 px. Todas las secciones siguen en el DOM.
- Verificación: tsc, eslint, 344 tests, build y 22/22 e2e en verde. Capturas en `docs/screenshots/fase6/`.

Pendiente: barra de herramientas con filtros como chips y popover, vista rejilla/lista, `ViewerToolbar` flotante (captura, pantalla completa, fondo), inspector en secciones plegables, papelera con la misma rejilla.

### Fase 6, segunda parte
- Biblioteca: interruptor Cuadrícula/Lista (`library-view-grid`, `library-view-list`). La lista es de una columna sin miniaturas; sigue siendo alta, se compactará en el pulido.
- Papelera: misma rejilla de tarjetas con miniatura atenuada y estado vacío con icono (`trash-*` intactos).
- Verificación: tsc, eslint, 344 tests, build y 22/22 e2e en verde.
- Pendiente: filtros como chips con popover, barra flotante del visor (captura, pantalla completa, fondo), secciones plegables del inspector.

### Para la Fase 8 (decidido con el dueño)
Pendientes de la Fase 6 que se hacen en el pulido final: filtros de la biblioteca como chips con popover, barra flotante del visor del estudio (captura, pantalla completa, fondo claro/oscuro), secciones plegables del inspector, lista compacta de la biblioteca. De la Fase 5: Crear en 3 zonas reales.

## Fase 7: resto de la app

Hecho (unificación, sin tocar funciones ni testids):
- Un solo radio y una sola superficie para tarjetas y paneles (`--radius-card` y `bg-surface-1`) en explorar, conexiones, embeds, API, facturación, uso, ajustes, ayuda, admin, el pago y la galería de ejemplos. Antes había radios de 14, 16, 20, 24 y 28 px.
- Títulos de página con la misma escala (API, conexiones y explorar estaban un paso más grandes).
- Explorar: la tabla de motores y la lista de límites van dentro de tarjetas.
- Sin desborde horizontal a 390 px en las 8 pantallas.
- Verificación: tsc, eslint, 344 tests, build y 22/22 e2e en verde. Capturas en `docs/screenshots/fase7/`.

Pendiente para la Fase 8: pestañas del kit y `DataTable` en API y admin, bloques de código con copiar unificados, `Stat` del kit en uso.

## Fase 8: pulido (parcial)

Hecho:
- **Favicon / `/icon`:** no existía ningún archivo de icono (el 404 de la auditoría). Se generó `src/app/icon.tsx` (el punto violeta sobre grafito, sin binario). Al probarlo apareció un bug real: el middleware de idioma (`src/proxy.ts`) reescribía `/icon` a `/en/icon`, que no existe, y lo devolvía 404. Se añadió `icon`/`apple-icon` a las excepciones del matcher, igual que `favicon.ico`.
- **Código muerto:** se borró `src/components/model-silhouette.tsx` (sin usos).
- **Movimiento reducido:** ya estaba bien cubierto por una regla global en `globals.css` que anula toda animación bajo `prefers-reduced-motion`; no hizo falta tocarlo.
- **Prueba de regresión visual (nueva, test 13):** recorre las 13 pantallas del dashboard (inicio, crear, biblioteca, estudio con modelo real, papelera, explorar, conexiones, embeds, API, facturación, uso, ajustes, ayuda) a 1440 y 390 px, con axe, sin desborde horizontal, sin texto menor a 12px, como máximo un visor vivo por pantalla, y sin errores de consola ni peticiones 404. Encontró y confirmó el arreglo de dos bugs reales:
  1. El 404 de `/icon` de arriba.
  2. Un desborde horizontal de 132px en el estudio a 390px: la celda del checksum usaba `truncate` (exige ancho acotado) dentro de una celda de grid sin `min-w-0`, así que el grid se ensanchaba para caber el hash completo. Se añadió `min-w-0` a las 9 celdas de la ficha de detalles.
- **Medición de presupuestos (parcial, sin Lighthouse — no está instalado en este entorno y no se agregó sin pedir permiso):** con Playwright se midió la transferencia real de la home a 390px: **1,66 MB antes de interactuar** (el objetivo del plan era ≤900 KB — no se cumple) y **2,26 MB con toda la página recorrida** (dentro del límite de 6 MB). Cero visores vivos al cargar, confirmado. No se investigó ni redujo el peso inicial en esta sesión.

Verificación: tsc, eslint, 344 tests, build y **23/23 e2e** (22 anteriores + la nueva) en verde.

Pendiente de la Fase 8:
- Reducir el peso inicial de la home (1,66 MB > 900 KB): imágenes AVIF/WebP más livianas en el primer pliegue, `srcset` ajustado.
- Lighthouse real (rendimiento/accesibilidad ≥85/≥95) — necesita instalar `lighthouse`, no hecho sin permiso.
- Prueba manual en Safari y Firefox (no disponibles en este entorno).
- Peso de las marquesinas de render (~28 miniaturas por página) sin medir aparte.
- Los pendientes ya anotados de las Fases 5 y 6 (Crear en 3 zonas, filtros en chips, barra del visor, inspector plegable).

### Lighthouse real (instalado como devDependency, 2026-11-13)

Medido en producción local (`next start`), sin red real (Chrome headless en esta máquina; los números de ejecución de JS pueden ser más altos que en un móvil real de gama media porque esta máquina no es ese móvil — se reportan tal cual, con esa salvedad).

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` (home, móvil) | **100** | **100** | 100 | 85 | 1.4 s | 0.005 | 50 ms |
| `/dashboard` (móvil) | **74** | 100 | 96 | 54 | 1.2 s | 0 | 1220 ms |
| `/dashboard/create` (móvil) | **90** | 100 (era 96) | 96 | 50 | 3.5 s | 0 | 90 ms |

Objetivo del plan: rendimiento ≥85, accesibilidad ≥95 (ambos en móvil). La home los supera con margen. `/dashboard` queda por debajo de 85 en rendimiento (74), principalmente por tiempo de arranque de JS (`bootup-time`, `mainthread-work-breakdown`) y 1220 ms de tiempo de bloqueo. SEO bajo en el dashboard es intencional: son páginas `noIndex`, Lighthouse penaliza eso aunque sea correcto.

**Bug real encontrado y arreglado:** Lighthouse marcó `color-contrast` en el texto "Cargando modelo…" del visor (`ModelViewerBox`): el pulso de carga (`.os-pulse`) bajaba la opacidad a 0.45, lo que en su punto más tenue dejaba el texto en un contraste de 2.79:1 (necesita 4.5:1). Como la prueba de regresión visual corre con movimiento reducido, nunca vio ese punto del pulso y no lo detectó — Lighthouse sí, por eso vale la pena tenerlo. Se subió el piso del pulso a 0.8 en `globals.css` (contraste ~5:1 en su punto más tenue). Confirmado: accesibilidad de `/dashboard/create` pasó de 96 a 100.

Pendiente: bajar el TBT de `/dashboard` (1220 ms) y el LCP de `/dashboard/create` (3.5 s) necesitaría dividir el JS del shell/compositor en fragmentos más pequeños — tarea de rendimiento aparte, no un arreglo de unas líneas. El peso de la home (1.66 MB inicial, medido en la ronda anterior) tampoco se redujo todavía.
