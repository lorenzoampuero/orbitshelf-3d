# Integraciones

Las tres usan la API `/api/v1`, así que comparten permisos, límites y saldo. El contrato está en [`public/openapi.json`](../public/openapi.json). Los tokens se crean en **API** dentro del panel.

| Pieza | Estado |
|---|---|
| API `/v1` | Probada de punta a punta con el servidor simulado |
| Iniciar generaciones por API | Apagado (`API_GENERATION_ENABLED`). No se debe encender hasta tener respuesta de fal sobre sus términos |
| MCP | Protocolo y herramientas probados con un cliente de prueba propio. **No probado con clientes reales** como Claude Desktop |
| Blender | **Nunca se ha ejecutado dentro de Blender.** Solo se comprobó que el archivo compila |

## MCP

Sin dependencias, requiere Node 22 o superior.

```json
{
  "mcpServers": {
    "orbitshelf": {
      "command": "node",
      "args": ["<ruta>/integrations/mcp/orbitshelf-mcp.mjs"],
      "env": { "ORBITSHELF_URL": "https://tu-sitio", "ORBITSHELF_API_TOKEN": "os_..." }
    }
  }
}
```

No tiene herramientas para comprar ni para publicar en tiendas. `create_generation` gasta saldo y exige `confirm: true`, que el cliente debe pedirle a la persona.

## Blender

1. En Blender 4.2 o superior: *Edit → Preferences → Add-ons → Install from Disk*, y elige `integrations/blender/orbitshelf_blender.py`.
2. En las preferencias del complemento, pon la dirección del sitio y un token que solo tenga `assets:read`.
3. En la vista 3D, abre la barra lateral (N) y la pestaña *OrbitShelf*.

**Por ahora solo importa modelos.** El origen del modelo y su estado de revisión quedan como propiedades del objeto. Hay que comprobar en Blender la orientación y la escala de lo importado.

## Pendiente, según demanda

- Webhooks firmados de la API: por ahora se consulta el estado con `GET /api/v1/assets/{id}`.
- Generar desde Blender.
- WooCommerce, Unity y Unreal.
