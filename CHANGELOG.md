# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Preparación de Railway: `railway.toml`, healthcheck `/api/salud/vida` y guía
  `docs/11-RAILWAY.md` (el deploy sigue siendo manual).
- Arquitectura de pagos (`docs/10-PAGOS-PASARELA.md`): puerto `PasarelaPagos`, simulador
  universitario y punto de extensión para Wompi (sin implementarlo).
- Balance operativo (`docs/BALANCE-OPERATIVO.md`): stack, flujo de compra y ownership de Postgres
  en Monica_BK (`MinimalShop_API`).
- Guía operativa de Supabase (`docs/08-SUPABASE.md`): variables de entorno, migraciones Prisma,
  errores frecuentes y comprobación de salud de la API.
- TLS local para desarrollo: `pnpm certs:dev` genera certificados en `apps/api/certs/` y la API
  arranca en HTTPS si existen (Swagger en Safari).
- Guía de testeo de seguridad (`docs/09-TESTEO-SEGURIDAD.md`) y e2e defensivos
  (`apps/api/test/security.e2e-spec.ts`).

### Changed

- El simulador de pagos queda activo con `PAYMENT_PROVIDER=mock` aunque `NODE_ENV=production`.
- La API escucha en `0.0.0.0` para el proxy de Railway.
- Documentación alineada al contrato en español: README, salud `/api/salud/*`, módulos
  `compartido/` + `modulos/`, y archivo del texto Spring en `docs/archivo/00-ESTADO-OBSOLETO.md`.
- Postgres remoto de desarrollo: proyecto **MinimalShop_API** en org **Monica_BK**
  (`rbgidchvwvadwxuidsxj`, región `us-east-1`). Schema aplicado con las 3 migraciones Prisma
  y seed demo.

### Fixed

- Conexión a PostgreSQL en Supabase (handoff Monica_BK):
  - **Causa del `P1000`:** contraseña de Database incorrecta (el formato Session pooler
    `postgres.<ref>@aws-0-<region>.pooler.supabase.com:5432` ya era válido). También puede
    fallar si se copian corchetes `[...]` del placeholder del dashboard.
  - **Ajustes:** password real en raíz y `apps/api/.env`, `JWT_SECRET` también en `apps/api/.env`,
    Session pooler puerto `5432` (no Transaction `6543`).
  - **Resultado:** `prisma migrate deploy` (3 migraciones), `prisma db seed`, salud
    `GET /api/salud/listo` (no existe `/api/v1/health`).
- Swagger UI en blanco en **Safari** (localhost), resuelto con TLS local y ajuste de CSP:
  - **Causa HTTP:** Helmet CSP con `upgrade-insecure-requests`; Safari fuerza HTTPS en assets de `/docs`.
  - **Causa HTTPS:** certificado autofirmado de `pnpm certs:dev` — Safari muestra aviso de seguridad
    (comportamiento esperado: alto foco en privacidad del usuario; en local el riesgo es bajo y se
    puede elegir “visitar el sitio web” para abrir Swagger).
  - **Solución:** `upgradeInsecureRequests: null` en desarrollo + `pnpm certs:dev` →
    `https://localhost:8080/docs`. Detalle en `docs/07-DESARROLLO.md`.
- Endurecimiento de seguridad (rama de auditoría):
  - JWT sin fallback `dev-secret`; mock de Stripe prohibido en production; upload de imágenes
    con MIME allow-list y 5 MB; Swagger off en production; throttle en login/register;
  `@Roles` en mutaciones de catálogo y cambio de estado de pedido.

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
