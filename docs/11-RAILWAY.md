# 11 — Despliegue en Railway

El repo está preparado para un servicio web que construye el [`Dockerfile`](../Dockerfile) de la raíz. Este documento no despliega nada: el alta del servicio, las variables y el primer deploy son manuales. Ver también [`railway.toml`](../railway.toml).

```mermaid
flowchart LR
  Railway["Railway web"] --> API["Nest"]
  API --> Supabase["Postgres Monica_BK"]
  API --> Redis["Redis"]
  API --> Storage["Supabase Storage"]
```

La API escucha `PORT` en `0.0.0.0`. Al arrancar el contenedor corre `prisma migrate deploy` y luego `node dist/main.js`. Railway termina TLS; no uses `pnpm certs:dev` ahí.

## Checklist

1. En Railway, nuevo servicio desde este repo. Builder: Dockerfile (lo fija `railway.toml`).
2. Añade un Redis (plugin de Railway o Upstash) y copia su URL a `REDIS_URL`.
3. Pega las variables de la tabla. No subas `.env` al repositorio.
4. Deploy. El healthcheck del proceso es `GET /api/salud/vida`.
5. Cuando Redis y Postgres respondan: `GET https://<tu-dominio>/api/salud/listo` debe decir que ambos están `up`.
6. Humo: `POST /api/v1/auth/ingreso` con un usuario del seed y, con el token de `admin@demo.com`, el simulador de un pedido de prueba.

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
