# Guía de integración frontend — MinimalShop API

Esta guía resume convenciones para conectar un cliente web o móvil con la API sin ambigüedades.

## Base URL y versión

| Entorno | Base |
|---------|------|
| Local | `http://localhost:8080/api` |
| Producción | `https://<tu-dominio>/api` |

- Rutas de negocio: **`/v1/...`** (ej. `/api/v1/catalogo/productos`).
- Salud: **`/api/salud/vida`** y **`/api/salud/listo`** (sin `v1`).
- OpenAPI: **`/docs`** si `SWAGGER_ENABLED=true`.

## Autenticación

1. `POST /api/v1/auth/registro` o `POST /api/v1/auth/ingreso` → cuerpo con `accessToken`, `refreshToken`, `expiresIn`, `usuario`.
2. Enviar en rutas protegidas: `Authorization: Bearer <accessToken>`.
3. Antes de expirar (~15 min): `POST /api/v1/auth/refrescar` con `{ "refreshToken": "..." }`.
4. Cerrar sesión: `POST /api/v1/auth/salir` con refresh token.

**Buenas prácticas**

- Guardar refresh token en almacenamiento seguro (httpOnly cookie o vault nativo); no en `localStorage` si puedes evitarlo.
- Reintentar una petición 401 una sola vez tras refrescar; si falla, redirigir a login.
- No decodificar el JWT para autorizar UI crítica: usar `usuario.rol` del login y validar en servidor.

## Cabeceras transversales

| Cabecera | Uso |
|----------|-----|
| `Authorization` | Bearer access token |
| `Idempotency-Key` | **Obligatoria** en `POST /api/v1/pedidos` (8–100 caracteres alfanuméricos, `-` o `_`). Reutilizar la misma clave devuelve el mismo pedido sin duplicar efectos. |
| `x-correlation-id` | Opcional en request; la API devuelve una en response (útil para soporte). Propágala en logs del cliente. |
| `Content-Type` | `application/json` salvo subida de imágenes (`multipart/form-data`, campo `archivo`). |

## Paginación

Query en listados: `pagina` (base 0), `tamano` (1–50, default 20).

Respuesta estándar:

```json
{
  "contenido": [],
  "pagina": 0,
  "tamano": 20,
  "totalElementos": 0,
  "totalPaginas": 0
}
```

## Errores

Cuerpo JSON uniforme (`RespuestaErrorDto`):

```json
{
  "code": "STOCK_INSUFFICIENT",
  "message": "…",
  "details": [],
  "timestamp": "2026-10-08T20:00:00.000Z",
  "path": "/api/v1/pedidos",
  "correlationId": "uuid-o-id-cliente"
}
```

**Manejo recomendado**

| HTTP | `code` típico | Acción UI |
|------|----------------|-----------|
| 400 | `VALIDATION_ERROR`, `IDEMPOTENCY_KEY_REQUIRED` | Mostrar campos en `details` |
| 401 | `TOKEN_INVALID`, `UNAUTHORIZED` | Refrescar o login |
| 403 | `FORBIDDEN` | Mensaje “sin permiso” |
| 404 | `NOT_FOUND` | Recurso inexistente |
| 409 | `STOCK_INSUFFICIENT`, `MODULE_DISABLED`, `COUPON_*` | Conflicto de negocio; no reintentar a ciegas |
| 429 | `TOO_MANY_REQUESTS` | Backoff en login/registro |
| 503 | `PAYMENT_PROVIDER_UNAVAILABLE` | Reintentar pago más tarde |

## Módulos activables

Si un módulo está desactivado (`GET /api/v1/admin/modulos` para superadmin), las rutas protegidas con `@RequiereModulo` responden **409** `MODULE_DISABLED`. El frontend debe ocultar menús según flags o capturar 409 y degradar la UX (ej. ocultar cupones en checkout).

## Flujos clave

### Catálogo (CU-01)

- `GET /api/v1/catalogo/productos?q=&categoriaId=&orden=precio_asc&pagina=0&tamano=20`
- `GET /api/v1/catalogo/productos/:id`
- Imágenes: URL en `imagenUrl` (firmada en Supabase o `/api/v1/medios/:clave` en local).

### Carrito y checkout (CU-03)

1. `GET /api/v1/carrito` — revisar `comprable`.
2. `POST /api/v1/carrito/items` `{ "productoId", "cantidad" }`.
3. `POST /api/v1/pedidos` + `Idempotency-Key` + `{ "direccionId" }` o `{ "direccionEnvio" }`, opcional `cupon`.
4. Respuesta incluye `pagarAntesDe` mientras el pedido está por pagar.

### Pago (CU-04)

1. `POST /api/v1/pagos/pedidos/:pedidoId/intento` → `clientSecret` (Stripe) o ids mock.
2. **No** existe endpoint de confirmación del cliente; el estado final llega por webhook o simulador.
3. `GET /api/v1/pagos/pedidos/:pedidoId` para polling de `estado` (`PENDING` | `SUCCEEDED` | …).

**Desarrollo con mock:** superadmin → `POST /api/v1/pagos/simulador/pedidos/:id/aprobar`.

### Seguimiento pedido (CU-05 / CU-09)

- Comprador: `GET /api/v1/pedidos`, `GET /api/v1/pedidos/:id`, `POST .../cancelar`, `POST .../recibido`.
- Vendedor: `GET /api/v1/vendedor/pedidos`, `PATCH .../estado` `{ "estado": "EN_PREPARACION" | "ENVIADO" | "ENTREGADO" }`.

## CORS

Configurar `CORS_ORIGINS` en el servidor con el origen exacto del frontend (incluye credenciales si usas cookies).

## Tipos TypeScript

Generar desde OpenAPI (`/docs-json`) o copiar DTOs de referencia en `05-CONTRATO-API.md`. Mantener `pagina`/`tamano` y códigos de error alineados con el contrato.

## Checklist antes de release frontend

- [ ] Manejo de refresh token y 401
- [ ] `Idempotency-Key` estable por intento de checkout (UUID v4)
- [ ] Paginación en todos los listados
- [ ] Mostrar `correlationId` en pantalla de error para soporte
- [ ] No asumir pago confirmado hasta `GET pagos` o estado pedido `PAGADO`
- [ ] Probar con `PAYMENT_PROVIDER=mock` y seed local
