# 03 — Flujos

Flujos implementados hoy en NestJS. El sujeto autenticado sale del JWT (`AuthUser.userId`).

## Autenticación

Un solo registro y un solo login.

```mermaid
sequenceDiagram
  participant C as Cliente
  participant Auth as AuthController
  participant Svc as AuthService
  participant DB as Postgres

  C->>Auth: POST /api/v1/auth/register
  Auth->>Svc: RegisterDto (rol ≠ SUPERADMIN)
  Svc->>DB: email único + Argon2 hash
  Svc-->>C: token JWT + user (sin password)

  C->>Auth: POST /api/v1/auth/login
  Auth->>Svc: LoginDto
  Svc->>DB: verify Argon2
  Svc-->>C: token JWT + user

  C->>Auth: GET /api/v1/me (Bearer)
  Auth-->>C: perfil
```

Roles: `COMPRADOR`, `VENDEDOR`, `SUPERADMIN`. Endpoints mutadores usan `RolesGuard`.

## Catálogo e inventario

```mermaid
flowchart TD
  List["GET /products público"] --> Cache["cache-manager"]
  Cache --> Prisma["Prisma findMany paginado"]
  Create["POST /products VENDEDOR"] --> Stock["stock inicial en product"]
  Image["POST /products/:id/image"] --> Media["MediaStore local o Supabase"]
  Media --> Url["image_url en product"]
  Mutate["create/update/delete"] --> Invalidate["invalida caché de catálogo"]
```

Stock se decrementa solo en checkout (`InventoryService.decrementIfAvailable` con `UPDATE … WHERE stock >= qty`).

## Carrito y checkout

```mermaid
sequenceDiagram
  participant C as Comprador
  participant Cart as CartController
  participant Co as CheckoutService
  participant Inv as Inventory
  participant Cup as CouponsService
  participant DB as Postgres
  participant Ev as EventEmitter

  C->>Cart: POST /cart/items
  Cart->>DB: upsert cart_item
  C->>Cart: POST /cart/checkout + Idempotency-Key
  Cart->>Co: CheckoutDto
  alt Idempotency-Key existente
    Co-->>C: mismo pedido
  else Nuevo
    Co->>DB: BEGIN
    loop líneas
      Co->>Inv: requireActive + decrementIfAvailable
    end
    opt couponCode
      Co->>Cup: redeem atómico
    end
    Co->>DB: INSERT order + items PENDIENTE_PAGO
    Co->>DB: DELETE cart
    Co->>DB: COMMIT
    Co->>Ev: order.placed
    Co-->>C: OrderResponse
  end
```

Estados de pedido:

```mermaid
stateDiagram-v2
  [*] --> PENDIENTE_PAGO: checkout
  PENDIENTE_PAGO --> PAGADO: payment confirm
  PAGADO --> CONFIRMADO: vendedor
  CONFIRMADO --> ENVIADO: vendedor
  ENVIADO --> ENTREGADO: vendedor
  PENDIENTE_PAGO --> CANCELADO: comprador
  PAGADO --> CANCELADO: comprador
  CONFIRMADO --> CANCELADO: comprador
  CANCELADO --> [*]: restore stock
  ENTREGADO --> [*]
```

## Pagos

```mermaid
sequenceDiagram
  participant C as Comprador
  participant Pay as PaymentsService
  participant GW as PaymentGateway
  participant DB as Postgres

  C->>Pay: POST /payments/orders/:id/intent
  Pay->>GW: createPaymentIntent
  GW-->>Pay: externalId + clientSecret
  Pay->>DB: upsert payment PENDING
  Pay-->>C: intent

  C->>Pay: POST /payments/orders/:id/confirm
  Pay->>GW: confirmPayment
  alt SUCCEEDED
    Pay->>DB: payment SUCCEEDED + order PAGADO
  end
  Pay-->>C: status
```

Sin `STRIPE_SECRET_KEY` el gateway usa mock local (útil en e2e).

## Eventos post-pedido

```mermaid
flowchart LR
  Checkout -->|"emit order.placed"| Bus["EventEmitter"]
  Bus --> Notif["NotificationsService → BullMQ"]
  Bus --> Reports["ReportsService → seller_metrics"]
  Notif --> Worker["NotificationsProcessor"]
  Worker --> Rows["INSERT notifications"]
```

El checkout **no espera** a Redis/BullMQ para responder; las notificaciones son asíncronas.

## Cupones y feature flags

- Crear cupón: `POST /coupons` (vendedor / superadmin).
- Aplicar: solo dentro del checkout (`redeem` incrementa `current_uses`).
- Reseñas, favoritos, blog y eventos consultan `feature_flags` antes de operar.
