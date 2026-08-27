# 07 — Desarrollo

## Scripts (raíz)

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala el workspace |
| `pnpm dev` | Nest en watch (`apps/api`) |
| `pnpm build` | Compila la API |
| `pnpm start` | Arranque producción (`dist`) |
| `pnpm test` | Unitarios |
| `pnpm test:e2e` | E2E marketplace |
| `pnpm prisma:generate` | Genera Prisma Client |
| `pnpm prisma:migrate` | `prisma migrate dev` |
| `pnpm prisma:seed` | Seed de desarrollo |

En `apps/api` también: `start:dev`, `prisma:migrate`, `prisma:seed`, `test:e2e`.

## Variables de entorno

Copia `.env.example` → `.env` (nunca commitear secretos).

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Postgres (local o Supabase) |
| `JWT_SECRET` | sí | ≥ 32 caracteres en prod |
| `JWT_EXPIRES_IN` | no | Default `1d` |
| `REDIS_URL` | sí* | BullMQ (`redis://localhost:6379`) |
| `PORT` | no | Default `8080` |
| `CORS_ORIGINS` | no | Lista separada por comas |
| `MEDIA_DRIVER` | no | `local` \| `supabase` |
| `UPLOAD_DIR` | no | Default `./uploads` |
| `SUPABASE_*` | si media supabase | URL, service role, bucket |
| `STRIPE_SECRET_KEY` | no | Vacío → mock de pagos |

\*Requerida para notificaciones; el checkout responde aunque el worker falle después.

## Migraciones y seed

```bash
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
```

Usuarios demo: `comprador@demo.com`, `vendedor@demo.com`, `admin@demo.com` / `demo12345`.
Cupón: `WELCOME10`.

## Tests

```bash
# Unitarios (pueden pasar sin DB)
pnpm test

# E2E — necesita Postgres + Redis alcanzables con .env
pnpm test:e2e
```

El suite `marketplace.e2e-spec.ts` cubre: registro, 401, RBAC 403, cupón aplicado, stock insuficiente, cupón inválido, intent+confirm de pago → `PAGADO`.

Hay un helper de Testcontainers (`test/testcontainers.*`) que se omite si Docker no está disponible; en CI se usan los servicios del workflow.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml): install → `prisma migrate deploy` → unit → e2e marketplace → build → `docker build`.

## Checklist antes de un PR

1. `pnpm --filter api build` OK  
2. E2E verde si tocaste auth / cart / orders / payments / coupons  
3. OpenAPI sigue coherente (DTOs anotados)  
4. Entrada en `CHANGELOG.md` bajo `[Unreleased]` si el cambio es visible  
5. Sin secretos en el diff  
