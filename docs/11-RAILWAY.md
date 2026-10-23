# 11 — Despliegue en Railway

El repo está preparado para un servicio web que construye el [`Dockerfile`](../Dockerfile) de la raíz. Este documento no despliega nada: el alta del servicio, las variables y el primer deploy son manuales. Ver también [`railway.toml`](../railway.toml).

```mermaid
flowchart LR
  Railway["Railway web"] --> API["Nest"]
  API --> Supabase["Postgres Monica_BK"]
  API --> Redis["Redis"]
  API --> Storage["Supabase Storage"]
```

La API escucha `PORT` en `0.0.0.0`. Al arrancar el contenedor corre `prisma migrate deploy` y luego `node dist/src/main.js`. Railway termina TLS; no uses `pnpm certs:dev` ahí.

El stage `runner` del Dockerfile reinstala las `dependencies` con `npm` (incluye el **CLI de Prisma**) y genera el client. Así `npx prisma migrate deploy` no falla con `Cannot find module '.../prisma/build/index.js'`. Solo `@prisma/client` no alcanza: hace falta el paquete `prisma` en `dependencies`.

## Start command (crítico)

Con imagen **Dockerfile**, Railway ejecuta el Custom Start Command / `startCommand` en
[forma exec **sin shell**](https://docs.railway.com/deployments/start-command#configure-the-start-command).
Si pones `npx prisma migrate deploy && node dist/src/main.js`, el `&&` llega como
argumento a Prisma: migra, sale 0 y **Nest nunca arranca** (502, logs solo de migrate).

Arranque correcto (CMD del [`Dockerfile`](../Dockerfile) y `startCommand` de
[`railway.toml`](../railway.toml)): el binario es `sh` y el script va en `-c`:

```bash
sh -c 'npx prisma migrate deploy && node dist/src/main.js'
```

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
```

El entrypoint es `dist/src/main.js` (Nest con `module: nodenext`), no `dist/main.js`.

**Dashboard:** Settings → Deploy → Custom Start Command **vacío** (recomendado) o
exactamente la línea `sh -c '…'` de arriba. Si queda `npx … && node …` sin `sh -c`,
o `pnpm` / `dist/main.js`, pisa el CMD y vuelves al 502.

## Checklist

1. En Railway, servicio desde este repo. Builder: Dockerfile (`railway.toml`).
2. Custom Start Command: vacío o `sh -c 'npx prisma migrate deploy && node dist/src/main.js'`.
3. Añade un Redis (plugin de Railway o Upstash) → `REDIS_URL` interna (`*.railway.internal`).
4. Pega las variables de la tabla. No subas `.env` al repositorio.
5. Deploy. Healthcheck: `GET /api/salud/vida` → debe loguear `API MinimalShop en :…`.
6. Cuando Redis y Postgres respondan: `GET https://<tu-dominio>/api/salud/listo`.
7. Humo: `POST /api/v1/auth/ingreso` y, con `admin@demo.com`, el simulador de un pedido.

## Variables

| Variable | Valor típico (proyecto universitario) |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Lo inyecta Railway. No lo fijes salvo que haga falta. |
| `DATABASE_URL` | Session pooler de Supabase (Monica_BK), puerto `5432` |
| `REDIS_URL` | Redis de Railway o Upstash |
| `JWT_SECRET` | Secreto de al menos 32 caracteres (o `JWT_KEYS`) |
| `PAYMENT_PROVIDER` | `mock` |
| `CORS_ORIGINS` | Origen del frontend, sin barra final |
| `MEDIA_DRIVER` | `supabase` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service_role |
| `SUPABASE_STORAGE_BUCKET` | `product-images` (créalo en Storage) |
| `SWAGGER_ENABLED` | `true` si la demo necesita `/docs`; si no, `false` |

`PAYMENT_PROVIDER=mock` deja activo el simulador de superadmin aunque `NODE_ENV` sea `production`. Wompi no está cableado. Detalle en [10-PAGOS-PASARELA.md](10-PAGOS-PASARELA.md).

## Disco e imágenes

El filesystem de Railway no persiste. No uses `MEDIA_DRIVER=local` en ese servicio: las fotos se pierden al redeploy. Con `supabase`, crea el bucket `product-images` en el proyecto de Mónica antes de subir imágenes.

## Qué no hace este repo

- No crea el proyecto en Railway ni ejecuta `railway up`.
- No guarda la contraseña de Database ni el `service_role`.
