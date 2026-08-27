# 04 — Conexiones

Cómo se conectan cliente, API, base de datos, colas y servicios externos.

## Despliegue local (Docker Compose)

```mermaid
flowchart TB
  subgraph host [Host]
    Client["HTTP client / Swagger"]
  end

  subgraph compose [docker-compose]
    API["api :8080"]
    PG["postgres :5432"]
    Redis["redis :6379"]
    Vol["uploads volume"]
  end

  Client -->|"/api/v1 y /docs"| API
  API -->|"DATABASE_URL"| PG
  API -->|"REDIS_URL"| Redis
  API -->|"MEDIA_DRIVER=local"| Vol
```

Servicios definidos en [`docker-compose.yml`](../docker-compose.yml). Healthchecks en Postgres y Redis antes de levantar la API.

## Sin Docker

```mermaid
flowchart LR
  Nest["pnpm dev :8080"] --> PG["Postgres local o Supabase"]
  Nest --> Redis["Redis local :6379"]
  Nest --> Uploads["UPLOAD_DIR ./uploads"]
```

## Superficie de red

```mermaid
flowchart TB
  In["TCP PORT (default 8080)"]
  In --> Api["/api/v1/** REST"]
  In --> Docs["/docs OpenAPI"]
  In --> Health["/api/v1/health"]

  Api --> JSON["application/json"]
  Api --> MP["multipart product images"]
```

Protecciones activas: Helmet, CORS (`CORS_ORIGINS`), `@nestjs/throttler`, JWT global (excepto `@Public()`).

## Integraciones opcionales

| Variable | Uso |
|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Storage cuando `MEDIA_DRIVER=supabase` |
| `SUPABASE_STORAGE_BUCKET` | Bucket de imágenes (default `product-images`) |
| `STRIPE_SECRET_KEY` | PaymentIntents reales; si vacío → mock |
| `STRIPE_WEBHOOK_SECRET` | Reservado para webhooks (sandbox) |
| `REDIS_URL` | BullMQ (notificaciones) |

```mermaid
flowchart LR
  Catalog --> Media["MediaStore"]
  Media -->|local| FS["UPLOAD_DIR"]
  Media -->|supabase| SB["Supabase Storage"]
  Payments --> GW["PaymentGateway"]
  GW -->|key presente| Stripe
  GW -->|sin key| Mock
  Notifications --> BullMQ --> Redis
```

## Confianza

```mermaid
flowchart LR
  Client["Cliente"] -->|"Bearer JWT"| API
  API -->|"sub = userId"| AuthZ["RBAC + ownership"]
  AuthZ --> DB["Postgres"]
```

El cliente **no** elige el `usuarioId` en la URL para autorizar: lo emite el servidor tras autenticar. Vendedor solo muta sus productos; comprador solo su carrito/pedidos.
