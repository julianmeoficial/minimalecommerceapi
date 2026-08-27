# MinimalEcommerce API

Backend REST de un marketplace comprador/vendedor. **Este repositorio no incluye frontend**: solo la API, el esquema y el contrato HTTP.

Arquitectura: **monolito modular** (un deploy, varios bounded contexts). Sustituye el CRUD anémico `controller/service/repository` del prototipo Spring Boot original.

## Módulos

```
identity      registro, login JWT, perfil, direcciones
catalog       categorías, productos, stock atómico, media
promotions    cupones usados por el checkout (no un CRUD aislado)
ordering      carrito, checkout transaccional, pedidos, preórdenes
engagement    reseñas, favoritos, notificaciones (escuchan OrderPlaced)
content       blog y eventos (satélite)
analytics     métricas de vendedor como proyección de OrderPlaced
shared        errores, JWT, CORS, media store, eventos de dominio
```

```
Cliente HTTP  →  /api/v1 + JWT + RBAC
                    ├─ identity
                    ├─ catalog
                    ├─ ordering ──► catalog (stock)
                    │            └──► promotions (cupón)
                    ├─ engagement  (OrderPlaced)
                    └─ analytics   (OrderPlaced)
```

## Contrato

Prefijo **`/api/v1`**. El sujeto del JWT manda: no se acepta `usuarioId` en la URL como autorización.

| Recurso | Ruta |
|---|---|
| Auth | `POST /api/v1/auth/register`, `/login` |
| Perfil | `GET/PUT /api/v1/me` |
| Direcciones | `/api/v1/me/addresses` |
| Catálogo | `GET /api/v1/products`, `POST` (vendedor) |
| Carrito / checkout | `/api/v1/cart`, `POST /api/v1/cart/checkout` |
| Pedidos | `/api/v1/orders`, `/sold` (vendedor) |
| Cupones | `/api/v1/coupons` |
| Reseñas / favoritos / notificaciones | `/api/v1/reviews`, `/favorites`, `/notifications` |
| Contenido / métricas | `/api/v1/blog`, `/events`, `/metrics` |
| OpenAPI | `/swagger-ui.html` |

Errores: `{ code, message, details, timestamp, path }` con 401/403/404/409. Listados paginados (`content`, `page`, `size`, `totalElements`). Checkout acepta cabecera `Idempotency-Key`.

## Arranque

Java 21. Secretos por variables de entorno (ver `.env.example`).

```bash
cp .env.example .env
docker compose up --build
```

API en `http://localhost:8080`. Swagger: `http://localhost:8080/swagger-ui.html`.

Sin Docker, MySQL 8 local + perfil `dev`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Seed de desarrollo (solo `dev`/`docker`):

- `comprador@demo.com` / `demo12345`
- `vendedor@demo.com` / `demo12345`

## Tests

```bash
./mvnw test
```

Usan H2 (MySQL mode) + Flyway. Cubren checkout con cupón, stock insuficiente, cupón no vigente, JWT y RBAC.

## Qué se corrigió del prototipo

- Un login, contraseñas con BCrypt, JWT, roles `COMPRADOR` / `VENDEDOR`.
- DTOs: las entidades JPA no salen por HTTP.
- Flyway en lugar de `ddl-auto=update`.
- Cupón aplicado en la misma transacción que el pedido.
- Stock con `UPDATE ... WHERE stock >= :qty`.
- Imágenes en directorio configurable (`APP_UPLOAD_DIR`), no en `src/`.
- Métricas y notificaciones reaccionan a `OrderPlaced`; no se actualizan a mano.
- Sin vistas HTML ni estáticos de frontend.

Documentación de remodelación: [docs/README.md](docs/README.md).
