# Paquete legal: decisiones tuyas y puntos para el abogado

Los 13 documentos legales (ES y EN) están en `src/content/legal/`. Son un **borrador**: no son asesoría jurídica y ninguna cifra o dato de la empresa está inventado. Lo que depende de ti se rellena con variables de entorno y, mientras falte, la página muestra el aviso "no configurado".

## 1. Datos que debes poner antes de vender (variables de entorno)

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_LEGAL_NAME` | Nombre o razón social de quien opera |
| `NEXT_PUBLIC_LEGAL_TAX_ID` | RUT o número fiscal |
| `NEXT_PUBLIC_LEGAL_ADDRESS` | Domicilio |
| `NEXT_PUBLIC_LEGAL_COUNTRY` | País |
| `NEXT_PUBLIC_LEGAL_JURISDICTION` | Ley que rige los términos, por ejemplo "Chile" |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Correo real de contacto (aparece en privacidad, reembolsos, DMCA, seguridad) |
| `NEXT_PUBLIC_SITE_URL` | Dominio público, para canónicos y sitemap |

## 2. Decisiones de negocio que escribí como propuesta (cámbialas si no te sirven)

Están en `src/content/legal/es.ts` y `en.ts`. Cada una es una promesa al cliente, así que conviene que las apruebes.

| Tema | Lo que dice el borrador | Dónde |
|---|---|---|
| Reembolso de primera compra | 14 días y menos del 10 % de los créditos usados | Reembolsos, sección 3 |
| Renovaciones | Se devuelve completa si cancelaste a tiempo | Reembolsos, sección 3 |
| Créditos mensuales del plan | No se acumulan al mes siguiente (ya lo dice la web de precios) | Términos 4 |
| Créditos de packs puntuales | **No vencen mientras la cuenta esté activa** (hoy el código no los vence) | Términos 4 |
| Cambio importante del servicio | Aviso previo y reembolso de créditos sin usar | Términos 2 |
| Cierre de cuenta | Créditos del plan se pierden; los de packs pueden reembolsarse | Términos 15 |
| Plazo de respuesta | 5 días hábiles para reembolsos y accesibilidad | Reembolsos 5, Accesibilidad 4 |
| Contra-aviso DMCA | 10 días hábiles | DMCA 4 |
| Sin SLA | No hay compromiso de disponibilidad | Términos 11 |
| Reventa | Prohibido revender el acceso a los motores como servicio propio | Uso aceptable 4 |
| Agente DMCA formal | Sin registro ante la oficina de EE. UU. todavía | DMCA 7 |

## 3. Cosas que el texto afirma y deben seguir siendo ciertas

Si cambia el producto, cambia el texto (y la fecha `lastUpdated` en `src/config/brand.ts`).

- Solo hay dos cookies, ambas necesarias (`os_session` 7 días, `os_shopify_state` 10 minutos). **Si añades analítica o anuncios, hay que actualizar Cookies y Privacidad y pedir consentimiento.**
- No se usan fotos ni modelos para entrenar IA propia.
- A las fotos se les quitan los metadatos antes de enviarlas al motor.
- La papelera conserva 30 días.
- Un trabajo que falla por error del proveedor devuelve los créditos solo.
- No tenemos ISO 27001, SOC 2, auditoría externa ni prueba de intrusión.
- Marcado automático de archivos generados: **no implementado** (artículo 50 del Reglamento de IA de la UE).
- Los motores solo se activan con confirmación escrita de que su licencia permite el uso comercial y la reventa.

## 4. Para el abogado

1. **Chile:** Ley 19.628 y su reforma (Ley 21.719). La entrada en vigencia y un posible aplazamiento no están confirmados con fuente primaria; el texto lo dice con cautela.
2. **UE:** Reglamento de IA, artículo 50, y calendario de aplicación (fuentes secundarias). Decidir si vendes a la UE.
3. **Derecho de retracto y garantía** de consumo en Chile para servicios digitales (Ley 19.496): confirmar qué se aplica y si el cliente es consumidor o empresa.
4. **Cláusulas contractuales tipo** para transferir datos a EE. UU. y el DPA firmable.
5. **Limitación de responsabilidad e indemnización:** revisar que sean exigibles en tu jurisdicción.
6. **Marca "OrbitShelf 3D":** es un nombre de trabajo, sin registro ni verificación de disponibilidad.
7. **Proveedores por nombrar** en la página de encargados (hosting, motores de IA, correo) cuando se elijan.
