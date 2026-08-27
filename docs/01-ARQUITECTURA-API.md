# 01 — Arquitectura de la API

Monolito modular NestJS: **un deploy**, varios módulos de dominio. Sin microservicios ni frontend en este repositorio.

## Stack

| Área | Tecnología |
|---|---|
| Runtime | NestJS 11 + TypeScript (strict) |
| Paquetes | pnpm workspace (`apps/api`) |
| BD | PostgreSQL (Supabase o contenedor local) |
| ORM | Prisma (migraciones versionadas) |
| Auth | Passport JWT + Argon2 + RBAC |
| Caché | `@nestjs/cache-manager` (lecturas de catálogo) |
| Colas | Redis + BullMQ (notificaciones) |
| Eventos | `@nestjs/event-emitter` (`OrderPlaced`) |
| Media | Supabase Storage o filesystem local |
| Pagos | Adaptador propio → Stripe (sandbox / mock) |
| Ops | Helmet, CORS, throttler, Pino, correlation-id, OpenAPI |

## Vista del proceso

```mermaid
flowchart TB
  Client["Cliente HTTP"]
  Docs["OpenAPI /docs"]

  subgraph process ["NestJS :8080"]
    Guards["Throttler + JWT + Roles"]
    Modules["Módulos de dominio"]
    Shared["shared: Prisma, Media, Errors"]
    Filter["GlobalExceptionFilter"]
  end

  PG["PostgreSQL"]
  Redis["Redis / BullMQ"]
  Storage["MediaStore"]
  Stripe["Stripe o mock"]

  Client --> Guards
  Docs --> Modules
  Guards --> Modules
  Modules --> Shared
  Modules --> Filter
  Shared --> PG
  Modules --> Redis
  Shared --> Storage
  Modules --> Stripe
```

## Ciclo de un request

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as JwtAuthGuard / RolesGuard
  participant Ctrl as Controller
  participant Svc as Service
  participant DB as Prisma / Postgres

  C->>G: HTTP /api/v1/... + Bearer
  alt Público (@Public)
    G->>Ctrl: pasa
  else Autenticado
    G->>G: valida JWT / rol
    G->>Ctrl: AuthUser
  end
  Ctrl->>Svc: DTO validado
  Svc->>DB: query / transacción
  alt ApiException
    Svc-->>C: code + status + correlationId
  else OK
    Svc-->>C: DTO / página
  end
```

## Módulos y dependencias

```mermaid
flowchart LR
  identity --> shared
  catalog --> inventory
  catalog --> shared
  cart --> inventory
  cart --> orders
  orders --> inventory
  orders --> complements
  orders -->|"OrderPlaced"| notifications
  orders -->|"OrderPlaced"| reports
  payments --> shared
  complements --> shared
```

- **Núcleo comercial:** identity, catalog, inventory, cart, orders, payments.
- **Async / proyección:** notifications, reports.
- **Complementos (feature flags):** cupones, reseñas, favoritos, blog, eventos.

Detalle de carpetas: [06-ESTRUCTURA.md](06-ESTRUCTURA.md).
