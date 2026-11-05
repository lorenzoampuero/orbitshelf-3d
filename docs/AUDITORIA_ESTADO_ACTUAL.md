# Auditoría del estado actual de OrbitShelf 3D

> Esta es la foto del punto de partida, antes de las Fases 1 a 9. El estado actual está en el README.

Fecha: 2026-11-05. Rama de trabajo: `feat/plataforma-multimodelo`. La especificación de origen está en `docs/spec-2026-11/`.

## Arquitectura

- Next.js 16 con App Router, React 19 y TypeScript. Interfaz en inglés (`/`) y español (`/es`).
- Un solo proceso de Node. El sondeo de trabajos se inicia en `src/instrumentation.ts`.
- Datos: `.data/db.json` y archivos en disco (`src/lib/store.ts`).
- Login: enlace mágico de Supabase, o login local firmado para desarrollo y pruebas.
- Proveedor: Sloyd (`src/lib/provider/sloyd.ts`).

## Recorrido de registro a descarga

| Paso | Estado | Nota |
|---|---|---|
| Registro | Parcial | El enlace mágico nunca se confirmó con un correo real |
| Subir fotos | Operativo | Valida tipo real, tamaño y píxeles; recodifica y quita metadatos |
| Crear trabajo | Solo con simulador | Sin créditos en Sloyd, nunca se llamó a la API real |
| Resultado | Solo con simulador | Descarga, validación y guardado privado probados con un servidor falso |
| Ver y revisar | Operativo | Visor y lista de 5 puntos |
| Descargar GLB | Operativo | Privado por organización |

## Funciones

| Función | Estado |
|---|---|
| Muestras demo (`vase`, `lamp`, `chair`) | Operativo; no son resultados de IA |
| Validación de fotos y GLB | Operativo |
| Reserva, idempotencia y reembolsos | Operativo sobre JSON local |
| Sloyd: 1 foto, 2 a 4 fotos, texto | Solo con simulador |
| Estudio y aprobación | Operativo |
| CSV de trabajos | Operativo |
| Web pública | Operativo; sin resultados reales (`showcase` vacío) |
| Esquema SQL con RLS | Probado en PGlite; la app no lo usa |
| Embeds, cobros, Shopify | Sin implementar; las pantallas lo dicen |
| Multimodelo, perfiles, proyectos, versiones, métricas de malla | Sin implementar |

## Variables de entorno requeridas

Solo nombres. Los valores nunca se guardan en el repositorio.

- Proveedor: `SLOYD_CLIENT_ID`, `SLOYD_CLIENT_SECRET`
- Login: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `AUTH_MODE`
- Sesión: `SESSION_SECRET`, `ALLOW_LOCAL_AUTH`
- Límites: `LOCAL_PAID_ATTEMPT_CAP`, `MAX_ACTIVE_JOBS_PER_ORG`
- Sitio y legal: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_*`
- Infraestructura: `TRUSTED_IP_HEADER`, `DATA_DIR`

## Riesgos y brechas, por prioridad

1. **No se puede publicar.** El JSON y el disco local no sobreviven en un hosting sin servidor y no admiten varios procesos.
2. **Ningún motor probado con dinero.** Calidad, costo real y márgenes son desconocidos, sobre todo en ropa.
3. **Términos de fal.** Prohíben revender u operar como "service bureau" (§6e-xii), piden autorización escrita para integraciones (§6e-ix) y prohíben exponer sus APIs a usuarios finales (§4b-ii). Requiere confirmación escrita antes de vender. No es asesoría legal.
4. **Licencias de modelos.** Hunyuan3D 2.1 excluye UE, Reino Unido y Corea del Sur. No se ha revisado la 3.1.
5. **Sin respaldo externo.** El repositorio no tiene remoto.
6. **El esquema SQL no coincide con la app.** Faltan prompt, vistas, sondeo e idempotencia. Los IDs de organización de la app son `org_…`, no UUID.
7. **RLS demasiado amplia.** `models_org_all` deja a un miembro cambiar `status` o `provenance` si entra directo por la API de Supabase.
8. **Controles en memoria.** El límite de solicitudes y el bloqueo de sondeo solo funcionan con un proceso.
9. **Datos legales sin configurar.** Operador, correo de soporte y textos sin revisión de abogado.
10. **Proyecto "MVP" de Supabase.** Lo usa otra app (airush). No se deben aplicar migraciones ahí.

## Plan

El orden por fases, los criterios de aceptación y el presupuesto de pruebas están en el plan aprobado. Las decisiones sobre las 46 filas del catálogo están en `docs/DECISIONES_MOTORES.csv`; son documentales, no resultados de pruebas.

**Presupuesto autorizado para motores: US$0.** Hasta que cambie, ningún motor se habilita y ningún precio se considera final.
