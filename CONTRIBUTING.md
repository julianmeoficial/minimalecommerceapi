# Contribuir

Gracias por contribuir a MinimalEcommerce API. Este documento resume el flujo de trabajo esperado.

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL 16 y Redis 7 (Docker Compose basta)

## Arranque local

```bash
git clone https://github.com/julianmeoficial/minimalecommerceapi.git
cd minimalecommerceapi
cp .env.example .env
cp .env apps/api/.env
pnpm install
pnpm certs:dev          # TLS local (recomendado para Safari + Swagger)
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm dev
```

Alternativa: `docker compose up --build`.

### Supabase (Postgres remoto)

Si prefieres Postgres gestionado en lugar de Docker local, sigue [`docs/08-SUPABASE.md`](docs/08-SUPABASE.md).
Resumen de lo que ya validamos en desarrollo:

1. Copia `.env` a `apps/api/.env` — Prisma solo lee el de `apps/api`.
2. Usa la connection string del **Session pooler** (`pooler.supabase.com:5432`), no la Direct ni Transaction (`6543`).
3. Pega la contraseña de **Settings → Database** sin los corchetes `[...]` del placeholder.
4. Ejecuta `prisma migrate deploy`, `prisma db seed` (opcional) y comprueba `GET /api/v1/health`.
5. Redis sigue siendo necesario en local (`REDIS_URL`) para BullMQ; Supabase no lo incluye.

Si ves `P1000 Authentication failed`, revisa la tabla de errores en `docs/08-SUPABASE.md`.

OpenAPI (Swagger UI): **https://localhost:8080/docs** (tras `pnpm certs:dev`).
Spec JSON: https://localhost:8080/docs-json

**Safari:** prioriza la seguridad del usuario. Con TLS local verás un aviso por el certificado
autofirmado; en localhost el riesgo es bajo — puedes **Mostrar detalles → visitar este sitio web**
para entrar a Swagger. Sin TLS, HTTP suele funcionar en Chromium pero Safari puede dejar `/docs` en
blanco; ver [`docs/07-DESARROLLO.md`](docs/07-DESARROLLO.md#tls-local-y-safari).

## Flujo de contribución

1. Abre un issue o describe el cambio propuesto.
2. Crea una rama desde `main` (o desde la rama activa del feature):
   ```bash
   git checkout -b feat/nombre-corto
   ```
3. Implementa el cambio en el módulo de dominio correspondiente (`apps/api/src/modules/...`).
4. Añade o actualiza tests (preferible e2e para flujos de checkout/auth).
5. Actualiza docs si cambias contrato, modelo o flujos:
   - `README.md` / `docs/*` para comportamiento
   - `CHANGELOG.md` bajo `[Unreleased]`
6. Abre un Pull Request con resumen y plan de prueba.

## Convenciones de código

- TypeScript strict; DTOs con `class-validator` (no exponer modelos Prisma por HTTP).
- Prefijo de rutas `/api/v1`; autenticación por JWT; autorización por rol (`RolesGuard`).
- Errores de dominio vía `ApiException` / helpers en `shared/errors` (códigos estables).
- Stock y cupones solo dentro de transacciones Prisma en checkout.
- Media solo a través de `MediaStore` (nunca escribir bajo `src/`).
- Secretos solo por variables de entorno (ver `.env.example`).

## Commits

Mensajes claros en español o inglés, enfocados en el *porqué*:

```text
feat(orders): aplica cupón en la misma transacción del checkout
fix(inventory): evita overselling con updateMany atómico
docs: actualiza contrato de pagos
```

## Tests

```bash
pnpm test                 # unitarios
pnpm test:e2e             # marketplace + security (Postgres + Redis)
pnpm --filter api build   # compilación
```

El e2e de seguridad (`security.e2e-spec.ts`) comprueba 401/403/IDOR/validación; ver `docs/09-TESTEO-SEGURIDAD.md`.

No envíes un PR que rompa el flujo e2e de checkout.

## Alcance fuera de este repo

- Frontend Minimal Shop
- Microservicios separados
- Nx monorepo completo

Si algo no está claro, pregunta en el PR o en el issue antes de ampliar el alcance.
