# 02 — Modelo de datos

Fuente de verdad: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).
Migraciones en `apps/api/prisma/migrations/`. IDs: **UUID**. Contraseñas: solo `password_hash` (nunca en respuestas).

## Conexión

```mermaid
flowchart LR
  Nest["NestJS PrismaService"] --> URL["DATABASE_URL"]
  URL --> PG["PostgreSQL 16"]
  PG --> Local["Docker Compose / local"]
  PG --> Supa["Supabase (prod/dev cloud)"]
```

Variables: ver `.env.example` (`DATABASE_URL`). RLS está habilitado en tablas sensibles como segunda barrera; la API conecta con rol de aplicación.

## Diagrama entidad-relación

```mermaid
erDiagram
  USER ||--o{ ADDRESS : tiene
  USER ||--o{ PRODUCT : vende
  CATEGORY ||--o{ PRODUCT : clasifica
  USER ||--o{ CART_ITEM : tiene
  PRODUCT ||--o{ CART_ITEM : en
  USER ||--o{ ORDER : compra
  ORDER ||--|{ ORDER_ITEM : contiene
  COUPON ||--o{ ORDER : aplica
  ORDER ||--o| PAYMENT : cobra
  USER ||--o{ COUPON : crea
  USER ||--o{ REVIEW : escribe
  PRODUCT ||--o{ REVIEW : recibe
  USER ||--o{ FAVORITE : marca
  PRODUCT ||--o{ FAVORITE : es
  USER ||--o{ NOTIFICATION : recibe
  USER ||--o{ BLOG_POST : autor
  CATEGORY ||--o{ BLOG_POST : tema
  USER ||--o{ EVENT : organiza
  SELLER_METRIC }o--|| USER : agrega

  USER {
    uuid id PK
    string email UK
    string password_hash
    enum role
    boolean active
  }
  PRODUCT {
    uuid id PK
    uuid category_id FK
    uuid seller_id FK
    decimal price
    int stock
    string image_url
    boolean preorder
    boolean active
  }
  ORDER {
    uuid id PK
    uuid buyer_id FK
    decimal subtotal
    decimal discount
    decimal total
    enum status
    string idempotency_key
  }
  PAYMENT {
    uuid id PK
    uuid order_id FK
    string provider
    string external_id
    enum status
  }
  COUPON {
    uuid id PK
    string code UK
    enum type
    decimal discount_value
    int max_uses
    int current_uses
  }
```

## Enums relevantes

| Enum | Valores |
|---|---|
| `UserRole` | `COMPRADOR`, `VENDEDOR`, `SUPERADMIN` |
| `OrderStatus` | `PENDIENTE_PAGO`, `PAGADO`, `PENDIENTE`, `CONFIRMADO`, `ENVIADO`, `ENTREGADO`, `CANCELADO` |
| `CouponType` | `PORCENTAJE`, `MONTO_FIJO` |
| `PaymentStatus` | `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELED` |
| `NotificationType` | `PEDIDO`, `STOCK`, `PROMOCION`, `SISTEMA`, `PAGO` |

## Núcleo vs satélites

```mermaid
flowchart TB
  subgraph nucleo [Nucleo comercial]
    U[users]
    P[products]
    Cat[categories]
    C[cart_items]
    O[orders]
    Oi[order_items]
    Pay[payments]
    Inv["stock en products"]
  end

  subgraph sat [Complementos y proyecciones]
    Cup[coupons]
    R[reviews]
    F[favorites]
    D[addresses]
    N[notifications]
    B[blog_posts]
    E[events]
    M[seller_metrics]
    FF[feature_flags]
  end
```

## Seed

`pnpm --filter api exec prisma db seed` crea usuarios demo, categoría, producto, cupón `WELCOME10` y feature flags activos. Detalle en [07-DESARROLLO.md](07-DESARROLLO.md).
