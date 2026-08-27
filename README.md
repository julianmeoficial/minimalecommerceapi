# MinimalEcommerce API

Backend REST de un marketplace (comprador / vendedor / superadmin). **Sin frontend**: solo la API, el esquema y el contrato HTTP.

**Stack:** NestJS · TypeScript · Prisma · PostgreSQL (Supabase) · Redis / BullMQ · JWT + Argon2 · Stripe (sandbox)

## Inicio rápido

```bash
cp .env.example .env
pnpm install
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm dev
```

| Recurso | URL |
|---|---|
| API | http://localhost:8080/api/v1 |
| OpenAPI | http://localhost:8080/docs |
| Health | http://localhost:8080/api/v1/health |

Con Docker (API + Postgres + Redis):

```bash
docker compose up --build
```

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `identity` | Registro, login JWT, perfil, direcciones, RBAC |
| `catalog` | Categorías, productos, caché de lecturas, media |
| `inventory` | Stock atómico (`decrementIfAvailable` / `restore`) |
| `cart` | Carrito autenticado |
| `orders` | Checkout transaccional + evento `OrderPlaced` |
| `payments` | Puerto `PaymentGateway` + Stripe (o mock local) |
| `notifications` | Consumer BullMQ de pedidos |
| `reports` | Métricas de vendedor / plataforma |
| `complements` | Cupones, reseñas, favoritos, blog, eventos, feature flags |
| `shared` | Prisma, guards, filtros, logging, throttling, OpenAPI |

## Contrato

Prefijo **`/api/v1`**. El sujeto viene del JWT (no se acepta `usuarioId` en la URL como autorización).

| Área | Rutas principales |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Perfil | `GET/PUT /me`, `/me/addresses` |
| Catálogo | `GET /products`, `POST /products` (vendedor) |
| Carrito | `GET/POST /cart`, `POST /cart/checkout` |
| Pedidos | `GET /orders`, `GET /orders/sold` |
| Pagos | `POST /payments/orders/:id/intent`, `/confirm` |
| Cupones / engagement | `/coupons`, `/reviews`, `/favorites`, `/notifications` |
| Reportes | `/reports/seller`, `/reports/platform` |

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
- [CHANGELOG.md](CHANGELOG.md) — historial de cambios
- [CONTRIBUTING.md](CONTRIBUTING.md) — cómo contribuir

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL 16 (local, Docker o Supabase)
- Redis 7 (notificaciones / colas)
