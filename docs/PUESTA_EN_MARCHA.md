# Puesta en marcha con Supabase

Pasos para conectar la cuenta nueva de Supabase. Sin ella, la app sigue funcionando en local con el JSON de `.data/`.

**Regla de claves:** la URL y la clave publicable (`sb_publishable_…`) no son secretas. La clave secreta (`sb_secret_…`) y la contraseña de la base de datos sí lo son: van solo en tu `.env`, nunca en el chat, en un commit ni en el navegador.

## 1. En Supabase

1. Crea el proyecto nuevo. **No uses el proyecto "MVP"**: lo ocupa otra app.
2. En *Project Settings → API* copia la URL, la clave publicable y la clave secreta.
3. En *Project Settings → Database* copia la cadena de conexión del *pooler* en modo sesión, con tu contraseña.

## 2. En tu `.env`

```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgres://...
```

## 3. Crear las tablas

Aplica `supabase/migrations/0001_init.sql` en el proyecto nuevo, desde el *SQL Editor* de Supabase. Crea las tablas, las reglas de acceso y el bucket privado `orbitshelf-private`.

## 4. Login

En *Authentication → URL Configuration*:
- *Site URL*: la dirección del sitio.
- *Redirect URLs*: `<tu-sitio>/auth/callback` y `<tu-sitio>/es/auth/callback`.

Luego prueba el enlace mágico con un correo real. **Este paso nunca se ha confirmado.**

## 5. Comprobar

Con el proyecto recién creado y vacío, antes de cargar datos reales:

```bash
TEST_DATABASE_URL="$DATABASE_URL" npx vitest run tests/db/real-postgres.test.ts
```

Lanza 20 solicitudes simultáneas contra un saldo de 3 y comprueba que solo se gasten 3. Deja una organización de prueba en la base; se puede borrar sin problema.

## 6. Pasar los datos locales (opcional)

```bash
npx tsx scripts/migrate-json-to-postgres.ts
```

Sin `--apply` solo informa qué copiaría. Con `--apply` copia, y se puede repetir sin duplicar.

## 7. Trabajos en segundo plano

- **Servidor Node siempre encendido (recomendado):** la app revisa los trabajos sola. Se pueden correr varias instancias: no se pisan.
- **Hosting sin proceso permanente:** define `CRON_SECRET` y haz que un programador llame a `POST /api/internal/poll` con `Authorization: Bearer <CRON_SECRET>`, idealmente cada minuto.

## 8. Apagar un motor sin desplegar

```sql
INSERT INTO public.engine_switches (engine_id, disabled, reason)
VALUES ('fal-rodin-2.5', true, 'motivo')
ON CONFLICT (engine_id) DO UPDATE SET disabled = true, reason = EXCLUDED.reason, updated_at = now();
```

Tarda hasta 30 segundos en aplicarse. Esta tabla solo puede apagar motores, no encenderlos.

## Límite a revisar

El plan gratuito de Supabase limita el tamaño de cada archivo en Storage (revísalo en tu proyecto). La app acepta GLB de hasta 60 MB, así que un archivo más grande que ese límite fallaría al guardarse.
