# MinimalEcommerce API

Backend REST de un marketplace comprador/vendedor. **Sin frontend**: solo la API, el esquema Prisma y el contrato HTTP.

Stack (Notion / Minimal Shop): **NestJS + TypeScript + Prisma + PostgreSQL (Supabase) + Redis/BullMQ**.

Arquitectura: **monolito modular** (un deploy, varios módulos de dominio).

## Módulos

```
identity        registro, login JWT (Argon2), perfil, direcciones, RBAC
catalog         categorías, productos, caché de lecturas, MediaStore
inventory       stock atómico (decrementIfAvailable / restore)
cart            carrito autenticado
orders          checkout transaccional + OrderPlaced
payments        puerto PaymentGateway + Stripe (sandbox/mock)
notifications   consumer BullMQ de eventos de pedido
reports         métricas de vendedor / plataforma
complements     cupones, reseñas, favoritos, blog/eventos, feature flags
shared          config, guards, filtros, logging, throttling, OpenAPI
```

## Contrato

Prefijo **`/api/v1`**. El sujeto del JWT manda.

| Recurso | Ruta |
|---|---|
| Auth | `POST /api/v1/auth/register`, `/login` |
| Perfil | `GET/PUT /api/v1/me` |
| Direcciones | `/api/v1/me/addresses` |
| Catálogo | `GET /api/v1/products`, `POST` (vendedor) |
| Carrito / checkout | `/api/v1/cart`, `POST /api/v1/cart/checkout` |
| Pedidos | `/api/v1/orders`, `/sold` (vendedor) |
| Pagos | `POST /api/v1/payments/orders/:id/intent`, `/confirm` |
| Cupones | `/api/v1/coupons` |
| Reseñas / favoritos / notificaciones | `/api/v1/reviews`, `/favorites`, `/notifications` |
| Reportes | `/api/v1/reports/seller`, `/platform` |
| Health | `GET /api/v1/health` |
| OpenAPI | `/docs` |

Errores: `{ code, message, details, timestamp, path, correlationId }`. Checkout acepta cabecera `Idempotency-Key`.

## Arranque

Node 22 + pnpm. Secretos por variables de entorno (ver `.env.example`).

```bash
cp .env.example .env
pnpm install
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm dev
# o
docker compose up --build
```

API en `http://localhost:8080`. Swagger: `http://localhost:8080/docs`.

Seed de desarrollo:

- `comprador@demo.com` / `demo12345`
- `vendedor@demo.com` / `demo12345`
- `admin@demo.com` / `demo12345`

## Tests

```bash
pnpm test
pnpm test:e2e
```

E2E cubre auth, checkout con cupón, stock insuficiente, cupón inválido y RBAC (requiere Postgres + Redis).

## Docs

Guía del núcleo Nest: [docs/09-NUCLEO-GUIA.md](docs/09-NUCLEO-GUIA.md). Documentación Spring histórica en `docs/00–08` (archivada).
