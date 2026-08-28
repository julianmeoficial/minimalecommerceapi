# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Guía operativa de Supabase (`docs/08-SUPABASE.md`): variables de entorno, migraciones Prisma,
  errores frecuentes y comprobación de salud de la API.
- TLS local para desarrollo: `pnpm certs:dev` genera certificados en `apps/api/certs/` y la API
  arranca en HTTPS si existen (Swagger en Safari).

### Changed

- Documentación reorganizada: se eliminan guías de remodelación / legacy Spring;
  quedan README, CHANGELOG, CONTRIBUTING y docs operativas del stack NestJS.

### Fixed

- Conexión a PostgreSQL en Supabase validada de punta a punta (desarrollo local):
  - **Causa del `P1000`:** la `DATABASE_URL` incluía corchetes literales `[...]` alrededor de la
    contraseña (placeholder del dashboard de Supabase), por lo que Postgres rechazaba las credenciales.
  - **Ajustes aplicados:** contraseña sin corchetes, **Session pooler** en puerto `5432` (no Transaction
    `6543`), mismo `.env` en raíz y `apps/api/.env` (Prisma lee desde `apps/api`).
  - **Resultado:** `prisma migrate deploy` (2 migraciones), `prisma db seed` y
    `GET /api/v1/health` → `{"status":"ok"}` contra la base remota.
- Swagger UI en blanco en **Safari** (localhost), resuelto con TLS local y ajuste de CSP:
  - **Causa HTTP:** Helmet CSP con `upgrade-insecure-requests`; Safari fuerza HTTPS en assets de `/docs`.
  - **Causa HTTPS:** certificado autofirmado de `pnpm certs:dev` — Safari muestra aviso de seguridad
    (comportamiento esperado: alto foco en privacidad del usuario; en local el riesgo es bajo y se
    puede elegir “visitar el sitio web” para abrir Swagger).
  - **Solución:** `upgradeInsecureRequests: null` en desarrollo + `pnpm certs:dev` →
    `https://localhost:8080/docs`. Detalle en `docs/07-DESARROLLO.md`.

## [1.0.0] - 2026-08-27

### Added

- Monolito modular NestJS + TypeScript (`apps/api`) con pnpm workspace.
- Persistencia Prisma sobre PostgreSQL (Supabase o Postgres local) con migraciones versionadas.
- Auth: registro/login únicos, Argon2, JWT, roles `COMPRADOR` | `VENDEDOR` | `SUPERADMIN`.
- Módulos de dominio: identity, catalog, inventory, cart, orders, payments, notifications, reports, complements.
- Checkout transaccional con cupón, stock atómico e `Idempotency-Key`.
- Evento interno `OrderPlaced` (`@nestjs/event-emitter`).
- Pagos vía puerto `PaymentGateway` (Stripe sandbox o mock local).
- Notificaciones asíncronas con BullMQ + Redis.
- Reportes de vendedor / plataforma como proyección de pedidos.
- Feature flags para reseñas, favoritos, blog y eventos.
- MediaStore (filesystem local o Supabase Storage); nada en el árbol `src/`.
- OpenAPI en `/docs`, Helmet, CORS, throttling, Pino + correlation-id.
- Docker Compose (API + Postgres + Redis), CI GitHub Actions, seed demo y tests e2e del flujo marketplace.

### Removed

- Runtime Spring Boot / Maven / MySQL / Flyway de la raíz operativa.

[Unreleased]: https://github.com/julianmeoficial/minimalecommerceapi/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/julianmeoficial/minimalecommerceapi/releases/tag/v1.0.0
