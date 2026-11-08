# Integraciones

Las tres usan la API `/api/v1`, así que comparten permisos, límites y saldo. El contrato está en [`public/openapi.json`](../public/openapi.json). Los tokens se crean en **API** dentro del panel.

| Pieza | Estado |
|---|---|
| API `/v1` | Probada de punta a punta con el servidor simulado |
| Iniciar generaciones por API | Apagado (`API_GENERATION_ENABLED`). No se debe encender hasta tener respuesta de fal sobre sus términos |
| MCP por URL (`POST /api/mcp`) | Probado de punta a punta (e2e) y con el cliente oficial del SDK de MCP. **No probado con las aplicaciones** Claude Code, Cursor, VS Code ni Claude Desktop: sus configuraciones salen de su documentación |
| MCP local (`integrations/mcp/orbitshelf-mcp.mjs`) | Mismas herramientas, para clientes que solo hablan stdio. Probado con un cliente de prueba propio |
| Blender | **Nunca se ha ejecutado dentro de Blender.** Solo se comprobó que el archivo compila |
| Unity (`unity/OrbitShelfImporter.cs`) | **Nunca se ha ejecutado en Unity.** Solo lee modelos (`assets:read`) y los guarda como GLB en `Assets/OrbitShelf`. Necesita glTFast |
| WooCommerce (`woocommerce/orbitshelf-viewer.php`) | **Nunca se ha instalado en WordPress.** Shortcode `[orbitshelf_viewer url="…"]` que incrusta el visor; solo acepta el dominio que fijes en Ajustes → OrbitShelf |

## MCP

### Por URL (recomendado)

En el panel, **Agentes y API → MCP** crea un token y rellena el comando de cada cliente. Dirección: `https://tu-sitio/api/mcp`, con `Authorization: Bearer os_...`. Es Streamable HTTP sin sesiones: una respuesta JSON por cada POST; `GET` responde 405. Cada herramienta ejecuta el manejador de la API pública `/api/v1` con ese mismo token, así que tiene sus permisos, límites y saldo. ChatGPT y claude.ai piden inicio de sesión con OAuth, que todavía no existe.

`create_generation` pide `confirm: true`, pero **esa confirmación la hace cumplir la herramienta, no el servidor**: un programa que llame a `/api/v1/jobs` con un token con `jobs:write` no la pide. Iniciar modelos por API sigue apagado (`API_GENERATION_ENABLED`). Los textos que devuelve una herramienta (por ejemplo, los títulos de tus modelos) los escribió una persona, no OrbitShelf: un agente debe tratarlos como datos.

### Local (stdio)

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

## Webhooks

En *API*, en el panel, agrega la dirección https de tu servidor. Te avisamos con `model.ready` y `model.failed`, y puedes enviar un `ping` de prueba.

Cada envío trae `OrbitShelf-Signature: t=<segundos>,v1=<firma>`. Para comprobarlo, calcula HMAC-SHA256 de `<segundos>.<cuerpo sin modificar>` con tu secreto y compáralo con `v1`. Rechaza firmas de más de 5 minutos.

```js
import { createHmac, timingSafeEqual } from "node:crypto";

function firmaValida(secreto, cabecera, cuerpo) {
  const [, t, v1] = cabecera?.match(/^t=(\d+),v1=([0-9a-f]{64})$/) ?? [];
  if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const esperada = createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest();
  return timingSafeEqual(esperada, Buffer.from(v1, "hex"));
}
```

Responde con un código 2xx. Si no, reintentamos hasta 6 veces durante unas 9 horas, así que el mismo `id` puede llegar más de una vez. No seguimos redirecciones ni aceptamos direcciones privadas.

Requiere `INTEGRATIONS_KEY`, porque el secreto se guarda cifrado. Solo se ha probado contra un receptor local.

## Pendiente, según demanda

- Generar desde Blender.
- Unreal, y probar WooCommerce y Unity en entornos reales.
