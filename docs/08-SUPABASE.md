# 08 — Conectar Supabase

La API Nest **no usa** `NEXT_PUBLIC_*` (eso es convención de Next.js). El backend lee las variables de `.env.example`.

Supabase aquí es **Postgres** (Prisma) y, si se activa, **Storage**. La autenticación de la API es JWT propio (`POST /api/v1/auth/ingreso`), no Supabase Auth. Redis no viene con Supabase.

## Proyecto actual

| | |
|---|---|
| Organización | Monica_BK |
| Proyecto | MinimalShop_API |
| Ref | `rbgidchvwvadwxuidsxj` |
| URL | `https://rbgidchvwvadwxuidsxj.supabase.co` |
| Región | East US (North Virginia), `us-east-1` |
| Pooler de sesión | `aws-0-us-east-1.pooler.supabase.com:5432` |

El proyecto anterior (otra cuenta) se eliminó. No hay dump que restaurar: el esquema se vuelve a crear con Prisma.

## Qué copiar desde el dashboard

| En Supabase | Variable en `.env` (raíz **y** `apps/api/`) |
|---|---|
| Project URL (`https://….supabase.co`) | `SUPABASE_URL` |
| **service_role** (Settings → API → *secret*) | `SUPABASE_SERVICE_ROLE_KEY` |
| Connection string → URI → **Session pooler** (puerto 5432) | `DATABASE_URL` |
| Nombre del bucket (ej. `product-images`) | `SUPABASE_STORAGE_BUCKET` |

**No uses** la clave *publishable* / *anon* como `SUPABASE_SERVICE_ROLE_KEY` ni como contraseña de `DATABASE_URL`. Prisma necesita la contraseña de **Database**. El `service_role` solo hace falta para Storage.

Prisma **solo** lee `apps/api/.env`. Después de editar la raíz:

```bash
cp .env apps/api/.env
```

## Plantilla `.env`

Alineada con [`.env.example`](../.env.example). Sustituye `TU_PASSWORD` por la contraseña de Database (sin corchetes).

```env
NODE_ENV=development
PORT=8080

# Session pooler, puerto 5432. No uses Direct (db.*.supabase.co) ni Transaction (6543) para migraciones.
DATABASE_URL=postgresql://postgres.rbgidchvwvadwxuidsxj:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=public
REDIS_URL=redis://localhost:6379

JWT_SECRET=genera-un-secreto-largo-minimo-32-caracteres
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DIAS=7

CORS_ORIGINS=http://localhost:3000
SWAGGER_ENABLED=true
PAYMENT_PROVIDER=mock

MEDIA_DRIVER=supabase
UPLOAD_DIR=../../.data/uploads
SUPABASE_URL=https://rbgidchvwvadwxuidsxj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role; basta para Storage (no hace falta otro token)
SUPABASE_STORAGE_BUCKET=product-images
MEDIA_URL_TTL_SEGUNDOS=3600
```

Si la contraseña contiene `@`, `#`, `%`, `&` u otros caracteres reservados en una URL, codifica **solo** ese segmento con `encodeURIComponent`.

`JWT_SECRET`, `REDIS_URL`, Stripe, SMTP y CORS **no** cambian al mover el proyecto de Supabase.

## Storage (imágenes de producto)

Con lo que ya tienes en `.env` alcanza: **no** hace falta anon key ni un token aparte. El backend usa `SUPABASE_SERVICE_ROLE_KEY` para subir, borrar y firmar URLs.

1. Bucket privado `product-images` (o el nombre de `SUPABASE_STORAGE_BUCKET`) en Storage del dashboard, o créalo por API con la service_role.
2. `MEDIA_DRIVER=supabase` en la raíz y en `apps/api/.env`.
3. Reinicia la API. Las lecturas son URLs firmadas (`MEDIA_URL_TTL_SEGUNDOS`, default 3600).

Con `MEDIA_DRIVER=local`, las fotos van a disco y no usan el bucket. En Railway usa siempre `supabase`.

## Aplicar el esquema

```bash
pnpm install
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed   # opcional: usuarios demo
pnpm dev
```

Comprueba:

- `GET http://localhost:8080/api/salud/vida` → `{"status":"ok"}` (proceso vivo; no toca la base).
- `GET http://localhost:8080/api/salud/listo` → Postgres y Redis responden.

No existe `/api/v1/health`.

Migraciones, en orden: `20260327000000_init` → `20260327000001_rls_basics` → `20261008000000_fase5_hardening`.

## Cambio de cuenta o proyecto nuevo

1. Crea (o usa) el proyecto vacío en la cuenta destino.
2. Copia URL, **service_role** y la URI del **Session pooler** (región real del proyecto).
3. Duplica `.env` en la raíz y en `apps/api/.env`.
4. `prisma migrate deploy` y, si quieres datos de demo, `prisma db seed`.
5. Reinicia la API y llama a `/api/salud/listo`.
6. Si `MEDIA_DRIVER=supabase`, recrea el bucket. Los objetos del proyecto viejo no se copian solos.
7. Revoca la contraseña de Database y el `service_role` del proyecto que ya no se usa.

## Errores frecuentes

| Error | Causa | Solución |
|---|---|---|
| `P1000 Authentication failed` | La contraseña de Database no es la del servidor. El formato de la URI puede estar bien y aun así fallar. Prisma a veces nombra el rol como `postgres` aunque el usuario sea `postgres.<ref>`. | En **Project Settings → Database**, resetea la contraseña y pégala en **ambos** `.env`. No uses la anon key, el `service_role` ni la contraseña de un proyecto borrado. |
| `P1000` con corchetes | Se copió el placeholder `[YOUR-PASSWORD]` | Quita los `[]` |
| `P1001 Can't reach server` | Host Direct sin IPv4, o pooler de otra región (`aws-1-…` si el proyecto está en `aws-0-…`) | Usa el host que muestra el dashboard en Session pooler, puerto `5432` |
| Prisma ignora el `.env` de la raíz | Solo editaste la raíz | `cp .env apps/api/.env` |
| Nest: falta `JWT_SECRET` | `apps/api/.env` no trae el secreto (Prisma no lo usa, Nest sí) | Copia también `JWT_SECRET` o `JWT_KEYS` al `.env` de `apps/api` |

### Comprobado el 2026-10-22 (MinimalShop_API / Monica_BK)

- Pooler correcto: `aws-0-us-east-1.pooler.supabase.com:5432` (`aws-1-…` no resuelve para este proyecto).
- Tras alinear la **Database password** en ambos `.env`: `prisma migrate deploy` aplicó las 3 migraciones y `prisma db seed` creó los usuarios demo.
- Si vuelve un `P1000` con URI bien formada, es casi siempre password desfasada: reset en el dashboard y volver a pegar.

## Notas

- **Redis** sigue siendo obligatorio (BullMQ y throttling). Local: `docker compose up -d redis` o un Redis gestionado.
- **RLS:** las migraciones lo habilitan y revocan `anon` / `authenticated`. Prisma conecta como owner y no queda filtrado por esas políticas.
- El aviso de Prisma 7 sobre `package.json#prisma` es deprecación del seed; no bloquea `migrate deploy`.
