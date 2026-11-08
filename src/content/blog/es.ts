import type { BlogPostCopy, BlogSlug } from "./index";

/**
 * Artículos del blog en español. Regla editorial: ninguna cifra sin fuente, y lo que no hemos medido lo decimos.
 * Las cifras que aparecen son cuentas que cualquiera puede repetir o datos de terceros con su límite señalado.
 */
export const blogEs: Record<BlogSlug, BlogPostCopy> = {
  "photo-to-3d-for-online-stores": {
    title: "De foto a modelo 3D para tu tienda online: qué funciona y qué no",
    summary: "Una guía sin humo sobre convertir fotos de producto en 3D con IA: cuándo sirve, cuándo no y cómo probarlo sin gastar de más.",
    sections: [
      { h: "Qué es y qué no es", p: ["Convertir una foto en un modelo 3D con IA significa que un motor genera una forma tridimensional a partir de una o varias imágenes. No es un escaneo: lo que la cámara no vio (la parte de atrás, los costados, el texto pequeño) lo inventa el motor. Por eso conviene tratar el resultado como un borrador que se revisa, no como una medición."] },
      { h: "Cuándo suele funcionar", p: ["Los productos sólidos, mates y con una silueta clara son los que mejor salen: una taza, un zapato, una silla, un estuche. Con dos a cuatro fotos del mismo producto (frente, atrás, costados) el motor tiene más información que seguir. Mantener la luz y la distancia iguales en todas las fotos ayuda."] },
      { h: "Cuándo cuesta más", p: ["El vidrio, el metal pulido, los materiales transparentes, los objetos muy delgados y la ropa blanda con pliegues profundos son casos difíciles para cualquier motor. No hemos medido todavía con qué frecuencia salen bien en un catálogo real, así que no prometemos un porcentaje. Si vendes de esos, prueba primero uno o dos productos y decide con lo que veas."] },
      { h: "El flujo que recomendamos", p: ["Fotografía el producto con fondo neutro, genera el modelo, revísalo con una lista de puntos (forma, superficies, lados que se inventó, color, textos y logos), apruébalo y recién entonces publícalo en la ficha. En OrbitShelf cada trabajo muestra su costo en créditos antes de confirmar, y un modelo no puede publicarse sin tu aprobación."] },
      { h: "Cómo empezar sin gastar de más", p: ["Elige un producto de cada tipo que vendes, genera uno por cada uno y compáralos con la foto. Con eso sabrás qué parte de tu catálogo es buena candidata antes de comprometer un plan grande. Si un producto no sale bien, déjalo fuera del catálogo 3D: un modelo engañoso hace más daño que no tener modelo."] },
    ],
  },

  "does-3d-increase-conversion": {
    title: "¿El 3D en la ficha de producto sube las ventas? Lo que se sabe y lo que no",
    summary: "Revisamos la evidencia disponible con cuidado, explicamos por qué las promesas de porcentajes grandes no son fiables y cómo medirlo en tu tienda.",
    sections: [
      { h: "Lo que se suele prometer", p: ["Muchos proveedores de 3D y realidad aumentada publican mejoras de conversión de 25 %, 60 % o más. En las páginas que revisamos no encontramos la metodología (cuánto tráfico, cuánto tiempo, qué se comparó), así que no usamos esas cifras. Un porcentaje sin método no es un dato, es un anuncio."] },
      { h: "Una prueba controlada, con sus límites", p: ["La evidencia más sólida que encontramos es una prueba controlada de una marca de moda (GANT) que reportó alrededor de un 6 % más de conversión en los productos con 3D. Es un caso único, de una marca grande, y la publicó el proveedor de la tecnología. Sirve como indicio, no como promesa para tu tienda."] },
      { h: "Por qué probarlo en una tienda pequeña es difícil", p: ["Una cuenta aproximada, con la fórmula habitual de tamaño de muestra (n ≈ 16 × p × (1 − p) ÷ d² por grupo, con 80 % de potencia y 5 % de significancia): si tu conversión es del 2 %, detectar una mejora relativa del 6 % (de 2,00 % a 2,12 %) exige del orden de 200.000 visitas por grupo. Una tienda con 10.000 visitas al mes no puede confirmar un efecto así en un test corto."] },
      { h: "Qué sí puedes medir", p: ["Cuántas personas abren el visor 3D, cuánto tiempo lo usan, si agregan al carrito más después de verlo y, sobre todo, si bajan las devoluciones por \"no era como en la foto\". Las devoluciones suelen mostrar el efecto con menos tráfico que la conversión. Compara productos parecidos con y sin 3D durante varias semanas, y anota los cambios de precio o de campañas para no atribuirle al 3D lo que fue otra cosa."] },
      { h: "Cómo lo plantearíamos", p: ["Elige 10 a 20 productos con tráfico parecido, pon 3D en la mitad, mantén todo lo demás igual durante 4 a 6 semanas y mira devoluciones, clics y carrito. Si no ves diferencia, no pasa nada: te ahorraste invertir en todo el catálogo. Si la ves, ya tienes tu propia cifra, que vale más que cualquiera de un blog."] },
    ],
  },

  "glb-obj-stl-which-format": {
    title: "GLB, OBJ o STL: qué formato necesitas para cada uso",
    summary: "Qué lleva cada formato, para qué sirve y cuál elegir según vayas a publicar en una tienda, usar un motor de juegos o imprimir.",
    sections: [
      { h: "GLB: el formato de la web", p: ["GLB es la versión binaria de glTF: un solo archivo que lleva la forma, los materiales y las texturas. Es el formato estándar para visores web y la opción natural para una tienda online. Si vas a mostrar el producto girando en una ficha, esto es lo que necesitas."] },
      { h: "OBJ: la forma, para llevarla a otro programa", p: ["OBJ guarda sobre todo la geometría y es muy compatible con casi cualquier programa de modelado, como Blender. En OrbitShelf el OBJ exportado lleva solo geometría, en metros. Es útil si vas a seguir editando el modelo o a importarlo a otro flujo, no para mostrarlo en una web."] },
      { h: "STL: para imprimir", p: ["STL guarda únicamente la superficie triangulada, sin color ni texturas, y es el formato de entrada de la mayoría de las impresoras 3D. En OrbitShelf el STL va en milímetros. Antes de imprimir revisa que el modelo sea una pieza cerrada y que la escala sea la correcta."] },
      { h: "Una tabla rápida", p: ["Publicar en una tienda o web: GLB. Seguir editando en Blender u otro programa: GLB u OBJ. Imprimir en 3D: STL. Motor de juegos: GLB suele ser lo más cómodo para empezar; confirma qué formato prefiere tu motor y revisa su guía."] },
      { h: "Un error común", p: ["Exportar un OBJ o un STL esperando que lleve los colores. No los lleva: si necesitas materiales y texturas, usa GLB. Y recuerda que un modelo generado con IA puede tener un color distinto al del producto real: compáralo con la foto antes de publicar."] },
    ],
  },

  "how-many-polygons-do-you-need": {
    title: "¿Cuántos polígonos necesita tu modelo? Una guía orientativa",
    summary: "Más polígonos no significa mejor. Cómo pensar el peso de un modelo según se vea en una web, en un juego o se imprima.",
    sections: [
      { h: "Por qué importa", p: ["Cada triángulo de un modelo hay que cargarlo y dibujarlo. Un modelo muy pesado tarda en cargar, hace lenta la ficha del producto y puede fallar en celulares de gama media. Uno demasiado simple pierde forma. La clave es encontrar el punto medio para el uso que le vas a dar."] },
      { h: "Para la web y la realidad aumentada", p: ["Aquí manda la velocidad de carga. Como regla práctica (no un estándar), conviene que el modelo sea ligero: busca que el archivo pese pocos megabytes y que gire con fluidez en un celular de gama media. Revisa también el límite de tamaño de la plataforma donde vas a publicar."] },
      { h: "Para juegos", p: ["El presupuesto depende del motor, de la plataforma y de cuántos objetos aparecen a la vez en pantalla. Un objeto secundario que se ve de lejos necesita bastante menos detalle que uno protagonista. Pregunta a tu equipo o consulta la guía de tu motor y exporta con ese límite en mente."] },
      { h: "Para imprimir", p: ["Aquí importa menos el número de triángulos y más que la malla sea cerrada, sin agujeros ni caras invertidas, y con el grosor suficiente en las partes finas. Un modelo muy detallado imprime bien si la malla está sana."] },
      { h: "Cómo lo manejamos", p: ["En OrbitShelf puedes revisar el diagnóstico del modelo (triángulos, vértices, tamaño del archivo), optimizarlo en una versión nueva sin perder la original y comparar las dos antes de elegir cuál usar. Prueba siempre en el dispositivo más modesto que usan tus clientes."] },
    ],
  },

  "how-to-choose-an-ai-3d-engine": {
    title: "Cómo elegir un motor de IA para 3D: ocho criterios y un método de prueba",
    summary: "No hay un motor mejor para todo. Una forma ordenada de comparar motores con tus propios productos y decidir con datos.",
    sections: [
      { h: "Por qué no hay un mejor motor", p: ["Cada motor de IA 3D tiene fortalezas distintas: unos respetan mejor la forma, otros dan mejores texturas, otros son más rápidos o baratos. Y lo que va bien con una taza puede ir mal con una chaqueta. Por eso conviene comparar con tus productos y no con los ejemplos de la web de cada proveedor."] },
      { h: "Los ocho criterios", p: ["1. Fidelidad a la foto. 2. Cómo se porta con tu categoría (ropa, brillantes, delgados). 3. Calidad de la malla: limpia, sin agujeros ni ruido. 4. Texturas y materiales. 5. Licencia: si el resultado se puede usar comercialmente, pedido por escrito. 6. Velocidad y tasa de fallos. 7. Costo por modelo utilizable, no por intento. 8. Qué hace el proveedor con tus datos, por ejemplo si entrena con ellos."] },
      { h: "El costo real es por modelo utilizable", p: ["Si un motor cuesta la mitad por intento pero necesita tres intentos para dar algo aceptable, no es más barato. Anota cuántos intentos necesitaste por producto y divide el gasto por los modelos que sí aprobaste. Es la cifra que importa."] },
      { h: "Un método de prueba simple", p: ["Elige 10 productos que representen tu catálogo (incluye uno difícil). Genera cada uno con cada motor que quieras comparar, con las mismas fotos. Puntúa del 1 al 5 los criterios que más te importan y suma. Guarda los resultados en una hoja: te servirá cuando salgan motores nuevos."] },
      { h: "Lo que hace OrbitShelf aquí", p: ["Te deja elegir el motor en cada trabajo, muestra el costo en créditos antes de confirmar y guarda el historial. No te decimos que uno sea el mejor: te damos el lugar para compararlos con tus fotos. Nuestra regla es activar un motor solo cuando está probado y tenemos confirmado por escrito que su licencia permite el uso comercial."] },
    ],
  },

  "first-3d-catalog-in-one-week": {
    title: "Tu primer catálogo 3D en una semana: plan día por día",
    summary: "Un plan práctico para pasar de cero a un puñado de productos en 3D publicados y medir si valen la pena.",
    sections: [
      { h: "Día 1: elige bien los productos", p: ["Escoge entre 5 y 10 productos. Prioriza los sólidos y mates con silueta clara, los que más devoluciones tienen por \"no era como en la foto\" y los que más tráfico reciben. Deja para después los transparentes, brillantes o muy delgados."] },
      { h: "Día 2: sesión de fotos", p: ["Una sola sesión, con la misma luz y el mismo fondo neutro. Tres o cuatro ángulos por producto: frente, atrás y costados, a la misma distancia y altura, con el objeto completo en el cuadro. Quita etiquetas y logos de terceros que no tengas derecho a mostrar."] },
      { h: "Día 3: genera, un intento por producto", p: ["Genera un modelo de cada producto. No repitas todavía: primero mira cuántos salen bien al primer intento, porque esa cifra te dice cuánto costará de verdad tu catálogo. Anota el costo en créditos de cada uno antes de confirmar."] },
      { h: "Día 4: revisa con calma", p: ["Gira cada modelo y compáralo con el producto real: forma, superficies, lados que se inventó, color y textos. Aprueba los buenos. Para los dudosos, prueba otro intento o déjalos fuera. Un modelo mediocre en la ficha resta confianza."] },
      { h: "Día 5: optimiza y publica", p: ["Revisa el peso, optimiza si hace falta, exporta en GLB y publícalo en la ficha o inserta el visor. Comprueba cómo se ve en un celular modesto."] },
      { h: "Días 6 y 7: mide", p: ["Anota cuántas personas abren el visor, si agregan al carrito, y cómo van las devoluciones de esos productos frente a otros parecidos. Decide con eso si ampliar el catálogo. Si el resultado es neutro, no pasa nada: aprendiste con poco gasto."] },
    ],
  },
};
