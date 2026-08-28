# 08 — Conectar Supabase

La API Nest **no usa** `NEXT_PUBLIC_*` (eso es convención de Next.js en el frontend). En el backend usamos las variables de `.env.example`.

## Qué copiar desde el dashboard de Supabase

| En Supabase | Variable en `.env` (raíz **y** `apps/api/`) |
|---|---|
| Project URL (`https://….supabase.co`) | `SUPABASE_URL` |
| **service_role** (Settings → API → *secret*) | `SUPABASE_SERVICE_ROLE_KEY` |
| Connection string → **URI** (Settings → Database) | `DATABASE_URL` |
| Nombre del bucket de Storage (ej. `product-images`) | `SUPABASE_STORAGE_BUCKET` |

**No uses** la *publishable* / *anon* key como `SUPABASE_SERVICE_ROLE_KEY`: solo sirve para clientes con RLS. El backend y Prisma necesitan la **service role** (Storage) y la **connection string de Postgres** (Prisma).

## Plantilla `.env`

Crea `.env` en la **raíz** y copia el mismo archivo a `apps/api/.env` (Prisma lee desde `apps/api`).

```env
NODE_ENV=development
PORT=8080

# Supabase → Database → Connection string → URI → pestaña "Session pooler" (puerto 5432)
# Pega SOLO la contraseña de Database, sin corchetes [] del placeholder
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:TU_PASSWORD@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=public

JWT_SECRET=genera-un-secreto-largo-minimo-32-caracteres
JWT_EXPIRES_IN=1d
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000

SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role, NO publishable
SUPABASE_STORAGE_BUCKET=product-images

MEDIA_DRIVER=local
UPLOAD_DIR=./uploads

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Para **subir imágenes a Supabase Storage**: crea el bucket `product-images` (público o con políticas) y pon `MEDIA_DRIVER=supabase`.

## Aplicar schema en Supabase

```bash
pnpm install
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed   # opcional
pnpm dev
```

Comprueba: `GET http://localhost:8080/api/v1/health` → `{"status":"ok"}`.

## Errores frecuentes

| Error | Causa | Solución |
|---|---|---|
| `P1000 Authentication failed` | Contraseña con corchetes `[...]` copiados del placeholder, o clave API en vez de password de DB | Usa la contraseña real de Settings → Database; si tiene `@`, `#`, `%`, etc., codifícala con `encodeURIComponent` |
| `P1001 Can't reach server` | Connection string "Direct" (`db.*.supabase.co:5432`) sin IPv4 | Usa **Session pooler** (`pooler.supabase.com:5432`) |
| Prisma lee otro `.env` | Solo editaste `.env` en la raíz | `cp .env apps/api/.env` antes de `prisma migrate` |

## Notas

- **Redis** no viene con Supabase: sigue siendo obligatorio para notificaciones (BullMQ). Local con `brew services start redis` o un Redis gestionado (Upstash, etc.).
- **Auth**: esta API usa JWT propio (`/auth/login`), no Supabase Auth.
- **RLS**: las migraciones ya habilitan RLS básico; Prisma conecta como owner y no se ve afectado en el flujo normal de la API.
