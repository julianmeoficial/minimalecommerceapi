# MinimalEcommerce API

Backend REST de un marketplace (comprador / vendedor / superadmin). **Sin frontend**: solo la API, el esquema y el contrato HTTP.

**Stack:** NestJS · TypeScript · Prisma · PostgreSQL (local, Docker o Supabase) · Redis / BullMQ · JWT + Argon2 · Stripe (sandbox)

Postgres por defecto del Compose y de CI es **local**. Supabase es el Postgres remoto opcional (hoy el proyecto `MinimalShop_API` en la cuenta Monica_BK). Ver [docs/08-SUPABASE.md](docs/08-SUPABASE.md) y [docs/BALANCE-OPERATIVO.md](docs/BALANCE-OPERATIVO.md).

## Inicio rápido

```bash
cp .env.example .env
cp .env apps/api/.env
pnpm install
pnpm certs:dev
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm dev
```

| Recurso | URL |
|---|---|
| API | https://localhost:8080/api/v1 (con `pnpm certs:dev`) |
| OpenAPI | https://localhost:8080/docs |
| Salud | https://localhost:8080/api/salud/vida y `/api/salud/listo` |

**Safari:** puede mostrar un aviso por el certificado local autofirmado; es normal (privacidad
estricta). En desarrollo puedes continuar al sitio — ver [docs/07-DESARROLLO.md](docs/07-DESARROLLO.md#tls-local-y-safari).

Con Docker (API + Postgres + Redis):

```bash
docker compose up --build
```

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `usuarios` | Registro, ingreso JWT, perfil, direcciones, RBAC |
| `catalogo` | Categorías, productos, caché de lecturas |
| `inventario` | Stock del vendedor |
| `carrito` | Carrito del comprador |
| `pedidos` | Checkout con `Idempotency-Key` y máquina de estados |
| `pagos` | Intento de pago, webhook Stripe o simulador mock |
| `notificaciones` | Cola BullMQ |
| `reportes` | Métricas de vendedor / plataforma |
| `complementarios` | Cupones, favoritos, contenido, flags |
| `resenas` | Reseñas tras pedido entregado |
| `compartido` | Prisma, guards, filtros, logging, throttling, OpenAPI, salud |

## Contrato

Prefijo **`/api/v1`**. Salud **sin** versión: `/api/salud/*`. El sujeto viene del JWT (no se acepta `usuarioId` en la URL como autorización). Detalle en [docs/05-CONTRATO-API.md](docs/05-CONTRATO-API.md).

| Área | Rutas principales |
|---|---|
| Auth | `POST /auth/registro`, `POST /auth/ingreso`, `/refrescar`, `/salir` |
| Perfil | `GET/PATCH /usuarios/yo`, `/usuarios/yo/direcciones` |
| Catálogo | `GET /catalogo/productos`, `POST /vendedor/productos` |
| Carrito | `GET /carrito`, `POST /carrito/items` |
| Pedidos | `POST /pedidos` (`Idempotency-Key`), `GET /vendedor/pedidos` |
| Pagos | `POST /pagos/pedidos/:id/intento` (no hay confirm del cliente) |
| Complementos | `/cupones`, `/resenas`, `/favoritos`, `/notificaciones` |
| Reportes | `/vendedor/metricas`, `/admin/reportes/plataforma` |
| Salud | `GET /api/salud/vida`, `GET /api/salud/listo` |

Errores: `{ code, message, details, timestamp, path, correlationId }`. Checkout acepta cabecera `Idempotency-Key`.

## Seed de desarrollo

| Email | Password | Rol |
|---|---|---|
| `comprador@demo.com` | `demo12345` | COMPRADOR |
| `vendedor@demo.com` | `demo12345` | VENDEDOR |
| `admin@demo.com` | `demo12345` | SUPERADMIN |

Cupón demo: `WELCOME10` (10 %).

## Tests

```bash
pnpm test
pnpm test:e2e
```

Los e2e cubren auth, checkout con cupón, stock insuficiente, cupón inválido, RBAC y pagos (requieren Postgres + Redis).

## Documentación

- [docs/README.md](docs/README.md) — índice
- [docs/08-SUPABASE.md](docs/08-SUPABASE.md) — conectar Postgres/Storage en Supabase
- [CHANGELOG.md](CHANGELOG.md) — historial de cambios
- [CONTRIBUTING.md](CONTRIBUTING.md) — cómo contribuir

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL 16 (local, Docker o Supabase)
- Redis 7 (notificaciones / colas)
