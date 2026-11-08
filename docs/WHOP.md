# Whop: cobro con créditos propios

Estado: **preparado, sin probar contra el Whop real.** Escrito con la documentación pública de Whop y probado solo con cargas simuladas (`tests/unit/whop.test.ts`). No hay botón de compra en el panel todavía.

## Cómo funciona

1. El cliente elige un plan o una recarga en OrbitShelf.
2. `POST /api/billing/checkout` con `{ "item": "plan:creator:49" }` pide a Whop un checkout y devuelve su dirección. El espacio de trabajo sale de la sesión, nunca del pedido.
3. El cliente paga en Whop.
4. Whop avisa a `POST /api/webhooks/whop`. Se verifica la firma, se busca el artículo en el catálogo de OrbitShelf y se acreditan los créditos con `store.adjustBalance(orgId, créditos, "plan_grant", "whop:<id de pago>")`.

Whop no tiene saldo prepago: los créditos viven en el libro de OrbitShelf.

## Qué protege el cobro

- La firma (Standard Webhooks: `webhook-id`, `webhook-timestamp`, `webhook-signature: v1,<base64>`) se calcula sobre `{id}.{timestamp}.{cuerpo crudo}` con HMAC-SHA256 y se compara en tiempo constante. Tolerancia de 5 minutos.
- Los créditos salen del catálogo (`CHECKOUT_CATALOG` en `src/lib/whop.ts`, derivado de `PLAN_TIERS` y las recargas). Lo que diga el cuerpo sobre créditos se ignora.
- Si el pago trae un monto y no cubre el precio (con 2 % de margen), no se acredita.
- La clave del libro es el id de pago: una entrega repetida devuelve `duplicate` y no suma nada.
- Sin `WHOP_WEBHOOK_SECRET` la ruta responde 404. Cuerpo máximo 1 MB.
- Un pago que no se puede atribuir (sin metadatos, artículo desconocido, espacio inexistente) se responde 200 y se registra, para que Whop no reintente para siempre. Hay que mirar esos avisos en el registro.

## Lo que falta verificar con un pago de prueba real

Marcado como "no verificado" en el código:

| Duda | Dónde se usa | Qué hacer |
|---|---|---|
| ¿Los `metadata` del checkout llegan en el webhook `payment.succeeded`? | `decideGrant` | Hacer un pago de prueba y mirar el cuerpo recibido. Si no llegan, hay que atribuir por `checkout_configuration_id` guardado al crear el checkout (tabla nueva). |
| Nombre del campo del monto (`usd_total`, `total`, `subtotal`) | `paidUsd` | Ajustar al campo real. Si no hay monto, no se compara. |
| Forma exacta del cuerpo de `POST /checkout_configurations` (plan en línea, `renewal_price`, `billing_period`, `redirect_url`) | `createCheckout` | Comparar con la respuesta real y corregir. |
| Campo de la dirección devuelta (`purchase_url`) | `createCheckout` | Idem. Solo se aceptan direcciones `https` de `whop.com`. |
| ¿Qué evento llega en cada renovación mensual y en los reembolsos o disputas? | `decideGrant` | Hoy solo cuenta `payment.succeeded`. Reembolsos y disputas **no restan créditos**: hay que decidir la regla antes de vender. |
| Comisión real de Whop y si hay 3 % de plataforma | `ASSUMED_PAYMENT_FEE` | Ver `docs/SIMULACION_PLANES.md` y `scripts/check-fee-scenarios.ts`. El piso de 60 % aguanta hasta 10,7 % + US$0,40. |
| Retiros a Chile | negocio | Verificar con Whop antes de cobrar. |
| ¿Whop actúa como comerciante de registro? | impuestos | Solo con "Whop Collects and Remits" (+2 %). |

## Qué hay que hacer tú

1. Cuenta de Whop con empresa creada; anota el `company_id` (`biz_...`).
2. Clave de API de la empresa con permisos `checkout_configuration:create`, `plan:create` y `webhook_receive:payments`.
3. Webhook de la empresa apuntando a `https://TU-DOMINIO/api/webhooks/whop`, con el evento `payment.succeeded`. Copia el secreto (`ws_...`).
4. En `.env`: `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_WEBHOOK_SECRET` y, si quieres, `WHOP_RETURN_URL`.
5. Hacer un pago de prueba de la recarga más barata y revisar la tabla de arriba.

Para probar el webhook en tu computador, Whop necesita una dirección pública (un túnel). Con la ruta sin firmar, responde 401.

## Pendiente de producto

- Botón "Comprar" en facturación (hoy solo existe la ruta).
- Renovación y vencimiento mensual de créditos de plan.
- Reembolsos y disputas.
- Mostrar al cliente su historial de pagos.
