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
pnpm install
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm dev
```

Alternativa: `docker compose up --build`.

OpenAPI en vivo: http://localhost:8080/docs

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
pnpm test:e2e             # marketplace flow (Postgres + Redis)
pnpm --filter api build   # compilación
```

No envíes un PR que rompa el flujo e2e de checkout.

## Alcance fuera de este repo

- Frontend Minimal Shop
- Microservicios separados
- Nx monorepo completo

Si algo no está claro, pregunta en el PR o en el issue antes de ampliar el alcance.
