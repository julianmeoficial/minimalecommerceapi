# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [Unreleased]

### Changed

- Documentación reorganizada: se eliminan guías de remodelación / legacy Spring;
  quedan README, CHANGELOG, CONTRIBUTING y docs operativas del stack NestJS.

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
