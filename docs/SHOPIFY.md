# Conexión con Shopify

**Estado:** el flujo completo está construido y probado contra un servidor simulado. **Nunca se ha probado en una tienda real.** Hasta entonces, la web no debe anunciarlo como disponible.

## Probar en una tienda de desarrollo

1. Crea una app en el panel de desarrolladores de Shopify y una tienda de desarrollo gratuita.
2. Permisos: `read_products`, `write_products`, `write_files`.
3. URL de redirección: `<tu-sitio>/api/integrations/shopify/callback`.
4. En tu `.env`, nunca en el chat:

```
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
INTEGRATIONS_KEY=  # 32 caracteres aleatorios o más. Si se pierde, hay que reconectar las tiendas.
```

5. Conecta la tienda en Ajustes. Aprueba un modelo y publícalo desde su página.
6. **Comprueba en el tema de la tienda que el visor 3D aparezca.** Depende del tema y no se puede garantizar desde aquí.

## Webhooks que debe tener la app

Apuntan a `<tu-sitio>/api/webhooks/shopify`: `app/uninstalled`, y para una app pública los de cumplimiento `customers/data_request`, `customers/redact` y `shop/redact`.

## Cómo llegar a tiendas reales

Una tienda de desarrollo no es distribución. Hay dos caminos, y hay que elegir antes de vender:

- **Distribución personalizada:** una app para una tienda u organización. Sirve para los primeros clientes, de uno en uno.
- **Tienda de apps de Shopify:** sirve para cualquier tienda, pero pasa por la revisión de Shopify y sus requisitos.

Revisa los requisitos actuales en la documentación de Shopify antes de decidir.

## Decisiones de diseño

- **Solo agrega:** usa `fileUpdate` con `referencesToAdd`. `productSet` reemplaza toda la lista de archivos del producto y podría borrar sus imágenes.
- **Confirmación explícita:** nada se publica solo. Hace falta un modelo aprobado, elegir el producto y confirmar.
- **Sin duplicados:** el mismo archivo en el mismo producto no se sube dos veces.
- **Tokens:** cifrados con AES-256-GCM. Nunca llegan al navegador.
- **Desconectar:** impide nuevas publicaciones. No borra los modelos ni los archivos que ya están en la tienda.
