import type { LegalDocCopy } from "./index";
import type { LegalSlug } from "./labels";

/**
 * Textos legales en español. Marcadores que rellena LegalDocument: {brand}, {operator}, {email}, {jurisdiction}.
 * Son un borrador para revisión de un abogado: no inventan datos de la empresa y marcan como pendiente lo que depende de decisiones del operador.
 */
export const legalEs: Record<LegalSlug, LegalDocCopy> = {
  privacy: {
    title: "Política de privacidad",
    summary: "Qué datos tratamos, para qué, con quién los compartimos, cuánto tiempo los guardamos y cómo ejerces tus derechos.",
    sections: [
      { h: "1. Quién es responsable", p: ["{operator} es responsable de los datos personales que se tratan a través de {brand}. Para cualquier consulta o solicitud sobre privacidad escribe a {email}.", "Si usas {brand} dentro de una empresa y nos subes datos de tus propios clientes, tú eres el responsable de esos datos y nosotros actuamos como encargados de tratamiento. En ese caso se aplica el Anexo de tratamiento de datos (DPA)."] },
      { h: "2. Qué datos recogemos", p: ["Cuenta: el correo con el que ingresas y, si los das, el nombre de tu espacio de trabajo y tu perfil de uso (por ejemplo, tienda, juegos o diseño).", "Contenido que subes o generas: fotos de productos, descripciones de texto (prompts) para texto a 3D, modelos 3D importados o generados, nombres, SKU, medidas, etiquetas, notas de revisión y versiones.", "Registros de uso: intentos de generación, historial de trabajos, movimientos de créditos, estado de aprobación y un registro de actividad de tu espacio.", "Integraciones: si conectas una tienda de Shopify guardamos el dominio de la tienda y el permiso de acceso que Shopify nos entrega, cifrado. Si creas una clave de API guardamos solo una huella de la clave; el valor completo se muestra una vez.", "Pagos: cuando se active el cobro, el pago lo procesa un proveedor externo (hoy previsto: Whop). Nosotros recibimos confirmaciones de pago, el identificador de la operación y la cuenta a la que corresponde; no recibimos ni guardamos el número de tu tarjeta.", "Datos técnicos: una cookie de sesión, la dirección IP, el tipo de navegador y registros del servidor, que usamos para seguridad, prevención de abusos y diagnóstico."] },
      { h: "3. Para qué los usamos y con qué base", p: ["Para prestarte el servicio que pides (generar, revisar, optimizar y exportar modelos, llevar tus créditos y publicar donde lo autorices). Base: ejecución del contrato.", "Para mantener el servicio seguro, evitar fraudes y abusos y diagnosticar fallas. Base: interés legítimo.", "Para llevar registros contables y fiscales y atender reclamos. Base: obligación legal e interés legítimo.", "Para responderte cuando nos escribes. Base: ejecución del contrato o interés legítimo.", "No vendemos tus datos, no los usamos para publicidad y no usamos tus fotos ni tus modelos para entrenar modelos de IA."] },
      { h: "4. Cookies y tecnologías similares", p: ["Usamos solo cookies estrictamente necesarias: una de sesión que te mantiene dentro (7 días) y, mientras conectas Shopify, una cookie breve de protección contra falsificación (10 minutos). No usamos cookies de analítica ni de publicidad. El detalle está en la Política de cookies."] },
      { h: "5. Tus fotos y el proveedor de IA", p: ["Cuando inicias un trabajo con IA, tus fotos (de una a cuatro) se reconvierten sin metadatos (incluida la ubicación GPS) y se envían al proveedor de generación 3D que elijas o que corresponda al motor. Con texto a 3D se envía la descripción que escribes. No incluyas datos personales ni información confidencial en ella.", "Ese proveedor procesa el contenido bajo sus propios términos y su propia política de privacidad. Puede dejar el archivo resultante disponible en una dirección web pública y difícil de adivinar durante un tiempo. Nosotros copiamos el archivo a almacenamiento privado, pero no debes subir fotos de productos sin lanzar ni de contenido confidencial.", "No subas fotos de personas ni imágenes sobre las que no tengas derechos."] },
      { h: "6. Con quién compartimos datos", p: ["Con proveedores que nos prestan servicios: generación 3D con IA, alojamiento, base de datos e inicio de sesión, cobros, correo y la tienda que conectes. Solo reciben lo necesario para su función. La lista actual y su estado están en la página de Encargados de tratamiento.", "También podemos entregar datos si una autoridad lo exige con base legal válida, o para defender nuestros derechos. Si hay una fusión o venta del negocio, los datos pasarán al nuevo responsable con las mismas protecciones y te avisaremos."] },
      { h: "7. Transferencias internacionales", p: ["Algunos proveedores tratan datos fuera de tu país, incluido Estados Unidos. Cuando la ley lo exige usamos garantías adecuadas, como cláusulas contractuales tipo, y limitamos lo que se transfiere."] },
      { h: "8. Cuánto tiempo los guardamos", p: ["Los datos de cuenta se guardan mientras la cuenta esté activa. Las fotos y los modelos, hasta que los borres o cierres la cuenta: al borrar un modelo se elimina su archivo 3D y su foto de origen de nuestro almacenamiento, pero no las copias que el proveedor de IA conserve bajo su política. Lo que mandas a la papelera se conserva 30 días y después se elimina definitivamente.", "Los registros de intentos y de pagos se guardan el tiempo que exijan las normas contables y tributarias. Los registros de seguridad, por un periodo limitado."] },
      { h: "9. Tus derechos", p: ["Según donde vivas puedes pedir acceso, rectificación, supresión, portabilidad, oposición y limitación del tratamiento, y retirar tu consentimiento cuando esa sea la base. Esto incluye los derechos que reconocen la Ley 19.628 de Chile y sus modificaciones (Ley 21.719, según su calendario de entrada en vigencia), el RGPD de la Unión Europea y leyes como la CCPA de California.", "Ya puedes descargar tus modelos y exportar tu historial de trabajos desde el espacio de trabajo. Para lo demás escribe a {email}. Respondemos dentro del plazo que fije la ley aplicable. Si no estás conforme, puedes reclamar ante la autoridad de protección de datos de tu país."] },
      { h: "10. Decisiones automatizadas", p: ["No tomamos decisiones sobre ti que produzcan efectos jurídicos basadas solo en tratamiento automatizado. La generación 3D es un resultado automático de IA sobre tu propio contenido, que tú revisas y apruebas."] },
      { h: "11. Seguridad", p: ["Aplicamos las medidas descritas en la página de Seguridad. Ningún sistema es completamente seguro; si una brecha afecta tus datos te avisaremos como exige la ley."] },
      { h: "12. Menores", p: ["El servicio es para empresas y profesionales y no está dirigido a menores de 18 años."] },
      { h: "13. Cambios", p: ["Cuando cambie esta política actualizaremos la fecha al inicio y te avisaremos de los cambios importantes antes de que entren en vigor."] },
    ],
  },

  terms: {
    title: "Términos de uso",
    summary: "Las reglas del servicio: cuentas, créditos y pagos, tu contenido, los resultados de IA, límites de responsabilidad y ley aplicable.",
    sections: [
      { h: "1. Acuerdo", p: ["Estos términos regulan tu uso de {brand}, operado por {operator}. Al crear un espacio de trabajo o usar el servicio los aceptas. Si lo usas en nombre de una empresa, confirmas que puedes obligarla.", "Forman parte del acuerdo, y debes leerlas: Política de privacidad, Política de reembolsos, Política de uso aceptable, Propiedad de los resultados y Anexo de tratamiento de datos."] },
      { h: "2. El servicio y su estado", p: ["{brand} te permite generar modelos 3D a partir de fotos o texto, importar modelos, revisarlos, optimizarlos, exportarlos y publicarlos. Las funciones marcadas como Planificadas o En pruebas pueden no existir todavía o funcionar de forma limitada. Podemos cambiar, suspender o retirar funciones mientras el producto se desarrolla; si el cambio te perjudica de forma importante, te avisaremos antes y podrás pedir el reembolso de los créditos sin usar."] },
      { h: "3. Edad y cuentas", p: ["Debes tener al menos 18 años y capacidad para contratar. Mantén seguro el acceso a tu correo y a tus claves de API: eres responsable de lo que ocurra en tu espacio. Avísanos de inmediato si sospechas un acceso no autorizado."] },
      { h: "4. Créditos, planes y precios", p: ["El servicio funciona con créditos. Cada trabajo muestra su costo en créditos antes de que lo confirmes; ese costo es el que se descuenta, salvo que venza el presupuesto mostrado, en cuyo caso se te pide revisarlo de nuevo.", "Los créditos mensuales de un plan no se acumulan para el mes siguiente. Los créditos de los packs puntuales no vencen mientras tu cuenta siga activa. Los créditos no tienen valor en dinero, no se pueden transferir ni canjear por efectivo.", "Si un trabajo falla por un error del proveedor o nuestro, los créditos se devuelven automáticamente. Los precios se muestran en dólares estadounidenses y pueden no incluir impuestos ni comisiones de pago según tu país. Podemos cambiar los precios hacia adelante; los cambios no afectan lo ya pagado y, si eres suscriptor, te avisamos antes de la siguiente renovación."] },
      { h: "5. Pagos, renovación y cancelación", p: ["Los pagos los procesa un proveedor externo. Los planes se renuevan cada mes hasta que los canceles. Puedes cancelar en cualquier momento desde el enlace de gestión de tu suscripción o escribiéndonos a {email}; la cancelación evita renovaciones futuras y conservas el acceso hasta el final del periodo pagado.", "Los reembolsos se rigen por la Política de reembolsos. Si un pago es revertido o disputado, podemos descontar los créditos asociados o suspender la cuenta mientras se resuelve."] },
      { h: "6. Tu contenido", p: ["Conservas todos los derechos sobre las fotos y datos que subes. Nos concedes una licencia limitada, no exclusiva y revocable para almacenarlos, procesarlos y enviarlos a nuestros proveedores solo para prestarte el servicio.", "Declaras que eres titular de cada imagen y texto que subes o que tienes permiso para procesarlo, incluidas las marcas, logos y diseños que muestre. No subas fotos de personas ni contenido sobre el que no tengas derechos."] },
      { h: "7. Uso aceptable", p: ["Debes cumplir la Política de uso aceptable. En resumen: no vulneres la seguridad ni los límites de uso, no accedas a otros espacios, no subas archivos maliciosos, no sobrecargues el servicio y no lo uses para infringir derechos de terceros ni engañar a compradores."] },
      { h: "8. Modelos generados con IA", p: ["Los modelos generados son aproximaciones y pueden contener superficies, colores, textos o logos inventados. Debes revisar cada modelo antes de usarlo y eres responsable de cómo lo muestras a tus clientes, incluido el cumplimiento de las normas de consumo y publicidad. El servicio no certifica medidas, seguridad ni calidad de fabricación. Más detalle en la página de Uso de IA y transparencia."] },
      { h: "9. Propiedad de los resultados", p: ["No reclamamos la propiedad de los modelos que generas. Tus derechos sobre ellos dependen de tus derechos sobre la foto de origen, de la ley de tu país y de los términos del motor usado. No garantizamos que un modelo generado esté libre de derechos de terceros. Revisa la página de Propiedad de los resultados."] },
      { h: "10. API e integraciones", p: ["Si usas la API o conectas servicios (por ejemplo Shopify), debes respetar sus límites y los términos de cada tercero. Las claves de API son personales de tu espacio: no las compartas ni las publiques. Podemos limitar o revocar claves que se usen de forma abusiva."] },
      { h: "11. Disponibilidad y soporte", p: ["Hacemos un esfuerzo razonable por mantener el servicio disponible, pero no garantizamos que funcione sin interrupciones ni errores, y los motores de IA de terceros pueden fallar o cambiar. Salvo un acuerdo escrito aparte, no hay un compromiso de nivel de servicio. El soporte se presta por correo a {email}."] },
      { h: "12. Garantías", p: ["En la medida permitida por la ley, el servicio se ofrece \"tal cual\" y \"según disponibilidad\", sin garantías de ningún tipo, incluida la idoneidad para un fin particular. Esto no limita los derechos que la ley de tu país no permita limitar."] },
      { h: "13. Limitación de responsabilidad", p: ["En la medida permitida por la ley, no respondemos por daños indirectos, consecuentes, pérdida de ganancias, de datos o de oportunidades de venta. Nuestra responsabilidad total se limita a lo que nos pagaste en los 12 meses anteriores al reclamo. Nada de estos términos limita la responsabilidad por dolo, culpa grave u otros casos que la ley no permita limitar."] },
      { h: "14. Indemnización", p: ["Si un tercero reclama contra nosotros por el contenido que subiste, por tu uso del servicio contrario a estos términos o por cómo publicaste un modelo, te haremos saber el reclamo y tú responderás por los daños y costos razonables que resulten, en la medida permitida por la ley."] },
      { h: "15. Suspensión y término", p: ["Podemos suspender o cerrar el acceso si incumples estos términos, si hay un riesgo para el servicio o para otros, o si lo exige la ley. Siempre que sea posible te avisaremos y te daremos la oportunidad de corregir. Puedes dejar de usar el servicio y borrar tu contenido en cualquier momento. Al cerrar la cuenta, los créditos sin usar de un plan se pierden; los de packs se pueden reembolsar según la Política de reembolsos."] },
      { h: "16. Ley aplicable y conflictos", p: ["Estos términos se rigen por las leyes de {jurisdiction}. Antes de acudir a un tribunal, las partes intentarán resolver el conflicto de buena fe escribiendo a {email}. Se mantienen las protecciones obligatorias de consumo de tu país de residencia y tu derecho a reclamar ante la autoridad que corresponda."] },
      { h: "17. Notificaciones y cambios", p: ["Te avisaremos por correo o dentro de la aplicación de los cambios importantes antes de que entren en vigor. Si una cláusula resulta inválida, el resto sigue vigente. Consultas sobre estos términos: {email}."] },
    ],
  },

  cookies: {
    title: "Política de cookies",
    summary: "Qué cookies usamos (solo las necesarias), cuánto duran y cómo controlarlas.",
    sections: [
      { h: "1. Qué son", p: ["Las cookies son pequeños archivos que el navegador guarda cuando visitas un sitio. Sirven para recordar que ya iniciaste sesión o para proteger una operación."] },
      { h: "2. Las que usamos", p: ["os_session: mantiene tu sesión iniciada. Es una cookie HTTP-only (el código de la página no puede leerla), con SameSite Lax, firmada y válida por 7 días. Es estrictamente necesaria.", "os_shopify_state: solo existe mientras conectas tu tienda de Shopify. Protege contra la falsificación de la solicitud. Dura 10 minutos y se borra al terminar la conexión. Estrictamente necesaria."] },
      { h: "3. Las que no usamos", p: ["No usamos cookies de analítica, de publicidad, de seguimiento entre sitios ni de redes sociales. Tampoco cargamos píxeles de anuncios. Por eso no mostramos un aviso para aceptarlas: no hay nada que aceptar.", "Si en el futuro añadimos analítica o publicidad, lo anunciaremos aquí, actualizaremos la fecha y pediremos tu consentimiento antes de usarlas cuando la ley lo exija."] },
      { h: "4. Otros servicios en las páginas", p: ["Si inicias un pago, serás llevado a la página de nuestro proveedor de cobros, que usa sus propias cookies bajo su política. Lo mismo ocurre si te vas a Shopify desde la integración. Esas cookies no las controlamos."] },
      { h: "5. Cómo controlarlas", p: ["Puedes borrar o bloquear cookies desde la configuración de tu navegador. Si bloqueas las de sesión no podrás iniciar sesión en el espacio de trabajo."] },
    ],
  },

  refunds: {
    title: "Política de reembolsos y cancelaciones",
    summary: "Cuándo se devuelven créditos o dinero, cómo se cancela y qué pasa si un trabajo falla.",
    sections: [
      { h: "1. Si un trabajo falla", p: ["Si un trabajo de generación falla por un error del proveedor o del servicio, los créditos reservados se devuelven solos a tu saldo y lo verás en tu historial de créditos como \"Error del proveedor reembolsado\". No tienes que pedirlo."] },
      { h: "2. Si el resultado no te gusta", p: ["La generación con IA es probabilística: dos intentos con la misma foto pueden dar resultados distintos y algunos no te servirán. Un resultado correcto pero que no cumple tu expectativa no da derecho a devolución automática de los créditos. Por eso mostramos el costo antes de generar y te sugerimos probar primero con un producto."] },
      { h: "3. Reembolso de una compra", p: ["Primera compra: dentro de los 14 días siguientes a tu primer pago puedes pedir el reembolso del plan o del pack si has usado menos del 10 % de los créditos comprados. Devolvemos el monto pagado, menos las comisiones de pago que no sean recuperables.", "Renovaciones: cancela antes de la fecha de renovación para evitar el cobro. Si te cobramos una renovación que cancelaste a tiempo, te la devolvemos completa.", "Créditos ya usados no se reembolsan. Los créditos mensuales de un plan no se acumulan al mes siguiente.", "Cobros duplicados o errores nuestros: se devuelven siempre."] },
      { h: "4. Cómo cancelar", p: ["Puedes cancelar tu suscripción cuando quieras desde el enlace de gestión de tu pago o escribiendo a {email}. Conservas los créditos y el acceso hasta el fin del periodo pagado."] },
      { h: "5. Cómo pedir un reembolso", p: ["Escribe a {email} desde el correo de tu cuenta con el identificador del pago. Respondemos en un plazo de 5 días hábiles. Si se aprueba, el reembolso se hace al medio de pago original y puede tardar el tiempo que tarde tu banco."] },
      { h: "6. Contracargos y disputas", p: ["Si tienes un problema con un cobro, escríbenos primero: lo resolvemos más rápido que una disputa bancaria. Si se abre un contracargo, podemos retirar los créditos asociados y suspender la cuenta mientras se resuelve."] },
      { h: "7. Derechos que no se pueden limitar", p: ["Esta política no limita los derechos que la ley de consumo de tu país te reconozca, incluidos los de retracto o garantía cuando sean aplicables."] },
    ],
  },

  "acceptable-use": {
    title: "Política de uso aceptable",
    summary: "Qué no se puede hacer en el servicio: contenido prohibido, abusos técnicos y reventa.",
    sections: [
      { h: "1. Para qué sirve esta política", p: ["Protege el servicio, a otros usuarios y a terceros. Forma parte de los Términos de uso. Si la incumples podemos retirar el contenido, limitar tu cuenta o cerrarla."] },
      { h: "2. Contenido que no puedes subir ni pedir", p: ["Contenido sexual que involucre a menores o cualquier material de explotación infantil.", "Fotos o modelos de personas reconocibles sin su permiso, incluidos los que sirvan para suplantar o engañar.", "Marcas, logos, personajes o diseños protegidos sobre los que no tengas permiso. En texto a 3D no pidas personajes con derechos de autor, logos de marcas ni personas reales.", "Objetos diseñados para causar daño: armas funcionales o sus piezas para fabricación, explosivos, dispositivos para eludir medidas de seguridad.", "Contenido ilegal en tu país o en el nuestro, o que incite al odio, la violencia o el acoso.", "Archivos con malware, o fotos con datos personales de terceros sin base legal."] },
      { h: "3. Qué no puedes hacer con el servicio", p: ["Intentar burlar la seguridad, los límites de uso, los controles de créditos o el aislamiento entre espacios.", "Acceder a espacios, modelos o claves de otros usuarios.", "Sobrecargar el servicio con solicitudes automáticas más allá de los límites de tu plan, o repartir el uso entre varias cuentas para eludirlos.", "Hacer ingeniería inversa del servicio, o extraer en masa modelos o datos que no sean tuyos.", "Usar la API con claves compartidas o publicadas."] },
      { h: "4. Reventa y uso competidor", p: ["Puedes usar los modelos que generas en tus productos y en servicios a tus clientes. No puedes revender el acceso a {brand} o a sus motores como un servicio propio de generación ni usar el servicio para construir un producto que compita con él, salvo acuerdo escrito."] },
      { h: "5. Presentar los modelos con honestidad", p: ["No presentes un modelo generado como una medición, una certificación o una garantía de calidad. No muestres a tus compradores un modelo que sepas que no representa el producto real. Eres responsable de revisar cada modelo antes de usarlo."] },
      { h: "6. Cómo reportar una infracción", p: ["Escribe a {email} con el enlace o el identificador del contenido y qué infringe. Para derechos de autor usa el procedimiento de la página de Derechos de autor."] },
      { h: "7. Qué hacemos ante una infracción", p: ["Según la gravedad podemos advertir, retirar el contenido, suspender o cerrar la cuenta y, cuando la ley lo exija, informar a las autoridades. Siempre que sea posible te explicaremos el motivo y podrás responder."] },
    ],
  },

  "ip-and-outputs": {
    title: "Propiedad de los resultados y licencias",
    summary: "De quién es lo que generas, qué derechos te damos y qué límites tienen los motores de IA.",
    sections: [
      { h: "1. Lo que subes", p: ["Tus fotos, descripciones y modelos importados siguen siendo tuyos. Solo nos das el permiso necesario para procesarlos y entregarte el resultado (ver los Términos de uso)."] },
      { h: "2. Lo que generamos para ti", p: ["{brand} no reclama la propiedad de los modelos 3D que se generan a partir de tu contenido. Nos limitamos a cederte, en la medida en que podamos, cualquier derecho que tengamos sobre ellos para que los uses, incluso con fines comerciales."] },
      { h: "3. Límites que debes conocer", p: ["Derecho de autor: en algunos países las obras creadas solo por IA pueden no tener protección de derechos de autor, o esta puede depender de cuánto aportó una persona. Si necesitas exclusividad o protección, consulta a un abogado de propiedad intelectual.", "Lo que se parece a algo existente: un modelo puede parecerse a un producto, personaje o diseño protegido por derechos de terceros. Tú eres responsable de revisar que no infrinja.", "Tus fotos: si la foto de origen tiene derechos de un tercero (un fotógrafo, una marca), esos derechos siguen alcanzando al modelo derivado."] },
      { h: "4. Términos de los motores", p: ["Cada motor de IA tiene sus propios términos sobre el uso de lo que genera. Nuestra regla es habilitar solo motores cuyos términos permitan a nuestros clientes usar el resultado comercialmente, y avisarte en el producto si un motor tiene restricciones. Esas confirmaciones se piden por escrito a cada proveedor antes de habilitarlo."] },
      { h: "5. Uso de tu contenido para entrenar IA", p: ["No usamos tus fotos ni tus modelos para entrenar modelos de IA propios. Los proveedores de motores tienen sus propias políticas sobre el uso de los datos que procesan; las revisamos antes de habilitar un motor y preferimos los que no entrenan con datos de clientes."] },
      { h: "6. Nuestra propiedad", p: ["El software, el diseño, los textos, las marcas y la documentación de {brand} son de {operator} o de sus licenciantes. No se te cede ningún derecho sobre ellos más allá del uso del servicio. Los modelos de ejemplo de la web son demostraciones y no puedes reutilizarlos como tuyos salvo que se indique lo contrario."] },
      { h: "7. Comentarios que nos envíes", p: ["Si nos das ideas o sugerencias, podemos usarlas para mejorar el servicio sin deberte pago ni atribución. No incluyas información confidencial."] },
    ],
  },

  "ai-disclosure": {
    title: "Uso de IA y transparencia",
    summary: "Cómo se generan los modelos, qué limitaciones tienen, cómo señalar que son generados por IA y qué hacemos hoy.",
    sections: [
      { h: "1. Qué parte del servicio usa IA", p: ["La generación de modelos 3D a partir de fotos o texto la hacen motores de IA de terceros. Las demás funciones (importar un GLB, revisar, optimizar, comparar versiones, exportar, publicar) no usan IA generativa para crear contenido nuevo."] },
      { h: "2. Límites que debes asumir", p: ["La IA inventa lo que no ve: la parte de atrás, los costados, el texto pequeño y los logos. Los materiales transparentes, los reflejos y las prendas blandas son casos difíciles. No medimos todavía la frecuencia de aciertos en un catálogo real, así que no prometemos un porcentaje.", "Por eso cada modelo pasa por una lista de revisión y por tu aprobación antes de poder publicarse."] },
      { h: "3. Transparencia hacia tus clientes", p: ["Si publicas un modelo en una tienda o en un material de marketing, no lo presentes como una fotografía ni como un escaneo del objeto real, a menos que lo sea. Indica que es una representación 3D y, cuando corresponda, que fue generada con apoyo de IA.", "Algunas normas, como el artículo 50 del Reglamento de IA de la Unión Europea, exigen señalar o marcar contenidos sintéticos en ciertos casos. Su calendario de aplicación cambia y tiene reglas distintas según el uso, así que consulta a un abogado si vendes en la Unión Europea."] },
      { h: "4. Qué hacemos hoy", p: ["Los modelos del producto se muestran en el espacio de trabajo con su origen (generado por IA, importado) y su estado de aprobación. El visor público solo funciona con modelos aprobados.", "El marcado automático legible por máquina de los archivos generados todavía no está implementado. Lo anunciaremos aquí cuando lo esté."] },
      { h: "5. Supervisión humana", p: ["Ningún modelo se publica sin que una persona de tu equipo lo haya revisado y aprobado. Los datos de entrada son tuyos, y nosotros no tomamos decisiones automatizadas sobre ti a partir de ellos."] },
      { h: "6. Cómo avisarnos de un problema", p: ["Si un modelo contiene contenido que no debería (por ejemplo, un logo o una cara reconocible) o un resultado engañoso, escribe a {email} con el identificador del modelo."] },
    ],
  },

  security: {
    title: "Seguridad",
    summary: "Medidas técnicas y de organización que aplicamos y lo que todavía no tenemos.",
    sections: [
      { h: "1. Qué hacemos", p: ["Sesiones firmadas con una cookie HTTP-only y protección contra solicitudes desde otros sitios (CSRF).", "Cada espacio de trabajo está aislado de los demás: un usuario no puede ver, modificar, descargar ni borrar modelos de otro espacio.", "Los archivos subidos se validan por tipo y tamaño. A las fotos se les quitan los metadatos, incluida la ubicación GPS, antes de enviarlas a un motor.", "Las claves de API tienen alcances limitados, se muestran una sola vez, se guardan solo como huella y se pueden revocar cuando quieras.", "Los webhooks entrantes (pagos, Shopify, motores) se aceptan solo con firma válida y con límite de tamaño; los créditos de un pago se abonan una sola vez aunque el aviso llegue repetido.", "Los secretos del servicio viven en variables de entorno y no se escriben en registros ni en el repositorio."] },
      { h: "2. Qué todavía no tenemos", p: ["No tenemos certificaciones como ISO 27001 o SOC 2, y no hemos hecho una auditoría externa ni una prueba de intrusión. No declaramos tener ninguna de ellas. Es un servicio joven: si tu empresa lo exige, escríbenos y vemos qué se puede acordar."] },
      { h: "3. Cuentas y accesos", p: ["En producción el acceso será por un enlace de un solo uso enviado a tu correo, sin contraseña (hoy hay un ingreso local solo para desarrollo). Recomendamos usar un correo corporativo con verificación en dos pasos.", "Ten cuidado con los permisos que das a las integraciones y revoca las que ya no uses."] },
      { h: "4. Copias de seguridad y continuidad", p: ["Nuestro proveedor de base de datos mantiene copias de seguridad según su plan. Todavía no hemos definido ni probado un plan de recuperación con tiempos comprometidos; no ofrecemos un objetivo de recuperación garantizado."] },
      { h: "5. Incidentes", p: ["Si detectamos una brecha que afecte tus datos, te avisaremos sin demoras indebidas y con la información disponible: qué ocurrió, qué datos y qué estamos haciendo. Cumpliremos los plazos que fije la ley aplicable."] },
      { h: "6. Cómo reportar una vulnerabilidad", p: ["Si encuentras una falla de seguridad, escribe a {email} con los pasos para reproducirla. Pedimos que no accedas a datos de otros usuarios, no degrades el servicio y nos des un plazo razonable para corregirla antes de divulgarla. Agradeceremos tu aviso y no iniciaremos acciones legales por una investigación de buena fe que siga estas reglas."] },
    ],
  },

  subprocessors: {
    title: "Encargados de tratamiento y proveedores",
    summary: "Qué terceros tratan datos para prestar el servicio, para qué y en qué estado están.",
    sections: [
      { h: "1. Cómo leer esta lista", p: ["Usamos terceros para prestar el servicio. Esta página los agrupa por función y dice si ya están activos o previstos. Los nombres de los proveedores de motores de IA se incorporan cuando cada motor se habilita; hasta entonces figuran como \"por definir\". Te avisaremos de los cambios importantes de esta lista con antelación razonable."] },
      { h: "2. Generación 3D con IA", p: ["Función: convertir fotos o texto en modelos 3D. Datos: las fotos (sin metadatos) o la descripción y los parámetros del trabajo. Quién: proveedores de motores de IA, por definir al habilitar cada motor. Ubicación: principalmente Estados Unidos. Estado: en integración; los motores se habilitan solo tras confirmar por escrito que los términos permiten el uso comercial y la reventa del servicio."] },
      { h: "3. Alojamiento y entrega de la aplicación", p: ["Función: ejecutar la aplicación y servir las páginas. Datos: tráfico y registros técnicos. Quién: proveedor de alojamiento, por definir. Estado: pendiente de elección para producción."] },
      { h: "4. Base de datos e inicio de sesión", p: ["Función: guardar cuentas, modelos, créditos y registros, y enviar los enlaces de acceso por correo. Datos: correo, contenido del espacio, registros de uso. Quién: Supabase (una cuenta nueva y exclusiva del producto). Estado: previsto; hoy el servicio funciona con almacenamiento local en desarrollo."] },
      { h: "5. Cobros", p: ["Función: procesar pagos y suscripciones y emitir confirmaciones. Datos: identificador de pago, monto, correo y datos de facturación que tú entregues al proveedor. Quién: Whop. Estado: integración preparada y probada con simulaciones, pendiente de una prueba con un pago real. No recibimos el número de tu tarjeta."] },
      { h: "6. Tiendas que conectas", p: ["Función: publicar modelos en tu tienda. Datos: dominio de la tienda, permiso de acceso (cifrado) y los productos y archivos que tú decidas publicar. Quién: Shopify, solo si conectas tu tienda. Estado: en pruebas."] },
      { h: "7. Correo y soporte", p: ["Función: responderte. Datos: el contenido de tus mensajes. Quién: el proveedor de correo del operador. Estado: por definir."] },
    ],
  },

  dpa: {
    title: "Anexo de tratamiento de datos (DPA)",
    summary: "Condiciones cuando tratamos datos personales de terceros en tu nombre, en línea con el RGPD y las leyes de protección de datos.",
    sections: [
      { h: "1. Ámbito y roles", p: ["Este anexo se aplica cuando, al usar {brand}, nos entregas datos personales de terceros (por ejemplo, personas que aparecen en una foto por error o datos de tu equipo) y tú decides para qué y cómo se tratan. En ese caso tú eres el responsable y {operator} es el encargado. Para los datos de tu propia cuenta somos responsables de forma independiente, según la Política de privacidad.", "Este texto es un resumen contractual. Si tu empresa necesita un DPA firmado por ambas partes, escríbenos a {email}."] },
      { h: "2. Qué tratamos y para qué", p: ["Objeto: prestar el servicio. Duración: mientras tengas la cuenta. Naturaleza: almacenar, procesar con IA, transformar y exportar tu contenido. Tipos de datos: los que aparezcan en el contenido que subas; no pedimos ni esperamos datos sensibles. Categorías de personas: tus usuarios y, de forma accidental, personas en las fotos."] },
      { h: "3. Nuestras obligaciones como encargados", p: ["Tratar los datos solo siguiendo tus instrucciones documentadas, que son estos términos y el uso que haces del servicio.", "Garantizar que las personas con acceso están sujetas a confidencialidad.", "Aplicar las medidas de seguridad de la página de Seguridad.", "Ayudarte, en lo razonable, a responder solicitudes de derechos de las personas y a cumplir tus obligaciones de seguridad, evaluación de impacto y notificación.", "Avisarte sin demoras indebidas si tenemos conocimiento de una brecha de seguridad que afecte tus datos.", "Al terminar el servicio, borrar o devolver los datos según elijas, salvo que la ley exija conservarlos."] },
      { h: "4. Subencargados", p: ["Autorizas el uso de los proveedores de la página de Encargados de tratamiento. Nos obligamos a imponerles protecciones equivalentes y a avisarte antes de añadir o cambiar uno importante, para que puedas oponerte; si no hay acuerdo, podrás cancelar y recibir el reembolso de lo no usado."] },
      { h: "5. Transferencias internacionales", p: ["Los datos pueden tratarse fuera de tu país, incluido Estados Unidos. Cuando la ley lo exige, la transferencia se apoya en cláusulas contractuales tipo u otra garantía válida."] },
      { h: "6. Auditoría", p: ["Pondremos a tu disposición la información razonable para demostrar el cumplimiento de este anexo y atenderemos auditorías razonables con aviso previo, una vez al año salvo una brecha, y sin acceso a datos de otros clientes."] },
      { h: "7. Responsabilidad", p: ["La limitación de responsabilidad de los Términos de uso se aplica también a este anexo, en la medida que la ley lo permita."] },
    ],
  },

  dmca: {
    title: "Derechos de autor y retiro de contenido (DMCA)",
    summary: "Cómo avisarnos de un contenido que infringe tus derechos y cómo responder si crees que se retiró por error.",
    sections: [
      { h: "1. Respetamos los derechos de terceros", p: ["No permitimos subir contenido sobre el que no tengas derechos. Si crees que un modelo, una foto o una página pública de {brand} infringe tus derechos de autor o de marca, avísanos con este procedimiento."] },
      { h: "2. Cómo enviar un aviso", p: ["Escribe a {email} con el asunto \"Aviso de derechos de autor\" e incluye: tu nombre y datos de contacto; qué obra está protegida; el enlace o identificador exacto del contenido en {brand}; una declaración de buena fe de que el uso no está autorizado; una declaración, bajo tu responsabilidad, de que la información es exacta y de que eres el titular o actúas en su nombre; y tu firma (puede ser tu nombre escrito)."] },
      { h: "3. Qué hacemos al recibirlo", p: ["Revisamos el aviso. Si parece fundado, retiramos o desactivamos el contenido y avisamos a la persona que lo subió, con una copia del aviso (sin tus datos privados si lo pides)."] },
      { h: "4. Contra-aviso", p: ["Si crees que retiramos contenido por error o que tienes derecho a usarlo, escribe a {email} con el asunto \"Contra-aviso\" e incluye: el contenido afectado y su ubicación anterior; una declaración de buena fe de que fue retirado por error; tu nombre, dirección y la aceptación de la jurisdicción que corresponda; y tu firma. Si el denunciante no inicia una acción legal en un plazo razonable (10 días hábiles), podemos restablecer el contenido."] },
      { h: "5. Infractores reincidentes", p: ["Cerramos las cuentas de quienes infrinjan derechos de forma reiterada."] },
      { h: "6. Avisos falsos", p: ["Enviar un aviso o contra-aviso que sabes falso puede tener consecuencias legales. Antes de enviarlo, consulta a un abogado si tienes dudas."] },
      { h: "7. Agente designado", p: ["Agente de derechos de autor: {operator}, contacto {email}. El registro formal de un agente ante la oficina de derechos de autor de Estados Unidos es una decisión pendiente del operador; hasta entonces este procedimiento rige para todos los avisos."] },
    ],
  },

  accessibility: {
    title: "Accesibilidad",
    summary: "Nuestro compromiso con una web que todos puedan usar, qué probamos y cómo reportar una barrera.",
    sections: [
      { h: "1. Nuestro objetivo", p: ["Queremos que {brand} se pueda usar con teclado, lector de pantalla y distintos tamaños de pantalla. Tomamos como referencia las pautas WCAG 2.1 nivel AA."] },
      { h: "2. Qué hacemos", p: ["Páginas con estructura de títulos y navegación por teclado, con foco visible y enlace para saltar al contenido.", "Contraste de color suficiente y texto que se puede ampliar sin romper el diseño. Evitamos textos de menos de 12 píxeles.", "Respetamos la preferencia de reducir el movimiento del sistema operativo.", "Pruebas automáticas de accesibilidad (axe) en las páginas públicas en cada versión, en computador y en móvil, sin desbordes horizontales."] },
      { h: "3. Lo que aún no está garantizado", p: ["Las pruebas automáticas detectan solo una parte de los problemas. No hemos hecho una auditoría manual completa con usuarios de tecnologías de apoyo, y el visor 3D tiene limitaciones para quienes no usan el mouse o el tacto. No declaramos conformidad total con WCAG."] },
      { h: "4. Cómo avisarnos de una barrera", p: ["Escribe a {email} con la página, qué intentabas hacer y qué te lo impidió, y tu navegador o tecnología de apoyo. Respondemos en un plazo de 5 días hábiles y, si podemos, ofrecemos otra forma de obtener la información."] },
    ],
  },

  "legal-notice": {
    title: "Aviso legal",
    summary: "Quién es el titular del sitio, cómo contactarlo y cuál es el estado de la marca.",
    sections: [
      { h: "1. Titular del sitio", p: ["El sitio y el servicio {brand} son operados por {operator}. Los datos de identificación (RUT o número fiscal, domicilio y país) se muestran en el recuadro \"Quién opera este servicio\" de cada documento legal, y deben estar completos antes de ofrecer el servicio al público.", "Contacto: {email}."] },
      { h: "2. Marca y nombre", p: ["\"OrbitShelf 3D\" es un nombre de trabajo. No hay registro de marca ni se ha verificado su disponibilidad ni la del dominio. Puede cambiar, y si cambia lo anunciaremos y mantendremos el acceso a tu cuenta y a tus modelos."] },
      { h: "3. Contenido del sitio", p: ["Los textos, el diseño y el código son de {operator} o de sus licenciantes. Puedes enlazar a las páginas públicas. No puedes copiar el sitio o presentarlo como tuyo. Los nombres de marcas de terceros que se mencionan (por ejemplo Shopify, Blender o Whop) pertenecen a sus titulares y se usan solo para identificar compatibilidades; no implican respaldo ni asociación."] },
      { h: "4. Información del sitio", p: ["Procuramos que la información sea exacta, pero el producto está en desarrollo y puede cambiar. Cuando algo no se ha medido, lo decimos. Las comparaciones con otros servicios son nuestras apreciaciones a la fecha indicada y pueden quedar desactualizadas."] },
      { h: "5. Enlaces a otros sitios", p: ["No controlamos los sitios de terceros a los que enlazamos ni respondemos por su contenido."] },
      { h: "6. Ley y tribunales", p: ["Este aviso se rige por las leyes de {jurisdiction}, sin perjuicio de las protecciones imperativas que corresponden a tu país de residencia."] },
      { h: "7. Estado del documento", p: ["Este aviso es un borrador para revisión legal. No es asesoría jurídica."] },
    ],
  },
};
