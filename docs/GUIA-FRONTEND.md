# Guía de integración frontend — MinimalShop API

Esta guía resume convenciones para conectar un cliente web o móvil con la API sin ambigüedades. El mapa completo de endpoints está en [05-CONTRATO-API.md](./05-CONTRATO-API.md); los schemas de request/response viven en OpenAPI (`/docs` y `/docs-json`).

## Base URL y versión

| Entorno | Base |
|---------|------|
| Local (HTTP) | `http://localhost:8080/api` |
| Local con `pnpm certs:dev` | `https://localhost:8080/api` |
| Producción (Railway) | `https://minimalshopapi.up.railway.app/api` |

| Recurso | Producción |
|---------|------------|
| OpenAPI UI | https://minimalshopapi.up.railway.app/docs |
| OpenAPI JSON | https://minimalshopapi.up.railway.app/docs-json |
| Salud (liveness) | https://minimalshopapi.up.railway.app/api/salud/vida |
| Salud (readiness) | https://minimalshopapi.up.railway.app/api/salud/listo |

- Rutas de negocio: `/v1/...` (ej. `/api/v1/catalogo/productos`).
- Salud: `/api/salud/vida` y `/api/salud/listo` (sin `v1`).
- OpenAPI: `/docs` si `SWAGGER_ENABLED=true` (activo en el despliegue actual de Railway).

## Configuración del cliente

Define la base **sin** barra final. Las rutas de negocio van bajo `/v1/...` respecto a esa base.

```bash
# Vite
VITE_API_URL=https://minimalshopapi.up.railway.app/api

# Next.js
NEXT_PUBLIC_API_URL=https://minimalshopapi.up.railway.app/api
```

```ts
const API = import.meta.env.VITE_API_URL; // o process.env.NEXT_PUBLIC_API_URL
// GET `${API}/v1/catalogo/productos`
```

## Cuentas demo (seed)

Disponibles en local tras `prisma db seed` (y en Railway si se re-seedó). El catálogo demo trae ~24 productos en **COP** con fotos Unsplash (`imagenUrl` absoluta).

| Email | Password | Rol | Qué probar |
|-------|----------|-----|------------|
| `comprador@demo.com` | `demo12345` | COMPRADOR | `GET /catalogo/productos`, carrito, `POST /pedidos`, favoritos, reseñas |
| `vendedor@demo.com` | `demo12345` | VENDEDOR | `POST/PATCH /vendedor/productos`, existencias, imagen, pedidos de venta, cupones, métricas |
| `admin@demo.com` | `demo12345` | SUPERADMIN | Categorías, `PATCH /admin/usuarios/:id`, reportes plataforma, simulador de pagos |

Login: `POST /api/v1/auth/ingreso` con `{ "email": "…", "password": "demo12345" }`.

Cupón demo: `WELCOME10` (10 %). Configura el cliente asumiendo `PAYMENT_CURRENCY=cop` (precios enteros en pesos, p. ej. `59900`).

## Autenticación

1. `POST /api/v1/auth/registro` o `POST /api/v1/auth/ingreso` → cuerpo con `accessToken`, `refreshToken`, `expiresIn`, `usuario`.
2. Enviar en rutas protegidas: `Authorization: Bearer <accessToken>`.
3. Antes de expirar (~15 min): `POST /api/v1/auth/refrescar` con `{ "refreshToken": "..." }` (rotación; reusar un refresh ya rotado revoca la familia).
4. Cerrar sesión: `POST /api/v1/auth/salir` con `{ "refreshToken": "..." }` → 204.

No hay API keys: toda ruta exige JWT salvo las marcadas públicas (`@Publico`).

**Buenas prácticas**

- Guardar refresh token en almacenamiento seguro (httpOnly cookie o vault nativo); no en `localStorage` si puedes evitarlo.
- Reintentar una petición 401 una sola vez tras refrescar; si falla, redirigir a login.
- No decodificar el JWT para autorizar UI crítica: usar `usuario.rol` del login y validar en servidor.
- Auth tiene throttle ~10 req/min (`registro` / `ingreso` / `refrescar`); el resto ~120/min. Ante **429**, backoff.

## Cabeceras transversales

| Cabecera | Uso |
|----------|-----|
| `Authorization` | Bearer access token |
| `Idempotency-Key` | **Obligatoria** en `POST /api/v1/pedidos` (8–100 caracteres alfanuméricos, `-` o `_`). Reutilizar la misma clave devuelve el mismo pedido sin duplicar efectos. |
| `x-correlation-id` | Opcional en request; la API la expone en response (CORS `exposedHeaders`). Propágala en logs del cliente. |
| `Content-Type` | `application/json` salvo subida de imágenes (`multipart/form-data`, campo `archivo`). |

## Ejemplos con `fetch`

Asume `const API = 'https://minimalshopapi.up.railway.app/api'`.

### Ingreso

```ts
const res = await fetch(`${API}/v1/auth/ingreso`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'comprador@demo.com',
    password: 'demo12345',
  }),
});
if (!res.ok) throw new Error(await res.text());
const sesion = await res.json();
// sesion.accessToken, sesion.refreshToken, sesion.expiresIn, sesion.usuario
```

### Catálogo (público)

```ts
const res = await fetch(
  `${API}/v1/catalogo/productos?pagina=0&tamano=20&orden=recientes`,
);
const pagina = await res.json();
// pagina.contenido, pagina.totalElementos, …
```

### Request autenticada

```ts
const res = await fetch(`${API}/v1/carrito`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const carrito = await res.json();
```

### Crear pedido (checkout)

```ts
const idempotencyKey = crypto.randomUUID(); // estable por intento de checkout
const res = await fetch(`${API}/v1/pedidos`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify({
    direccionId: '…', // o direccionEnvio: { … }
    // cupon: 'WELCOME10',
  }),
});
const pedido = await res.json();
```

### Intento de pago + polling

```ts
const intento = await fetch(`${API}/v1/pagos/pedidos/${pedidoId}/intento`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
}).then((r) => r.json());
// intento.clientSecret (Stripe) o ids mock — no hay endpoint de “confirmar” en el cliente

async function esperarPago(pedidoId: string, accessToken: string) {
  for (let i = 0; i < 30; i++) {
    const pago = await fetch(`${API}/v1/pagos/pedidos/${pedidoId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());
    if (pago.estado === 'SUCCEEDED' || pago.estado === 'FAILED') return pago;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Timeout esperando pago');
}
```

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
3. `GET /api/v1/pagos/pedidos/:pedidoId` para polling de `estado` (`PENDING` | `SUCCEEDED` | …). Intervalo sugerido: 1–2 s, con tope de reintentos.

**Mock (también en production):** superadmin → `POST /api/v1/pagos/simulador/pedidos/:id/aprobar`.

### Seguimiento pedido (CU-05 / CU-09)

- Comprador: `GET /api/v1/pedidos`, `GET /api/v1/pedidos/:id`, `POST .../cancelar`, `POST .../recibido`.
- Vendedor: `GET /api/v1/vendedor/pedidos`, `PATCH .../estado` `{ "estado": "EN_PREPARACION" | "ENVIADO" | "ENTREGADO" }`.

## CORS

En Railway (y en local), `CORS_ORIGINS` debe incluir el **origen exacto** del frontend, sin barra final (ej. `http://localhost:3000` o `https://tu-app.vercel.app`). La API usa `credentials: true` y expone `x-correlation-id`.

Si el origen no está en la lista, el navegador bloquea las peticiones aunque `curl` funcione. Varios orígenes: lista separada por comas.

## Tipos TypeScript

Los schemas no están en el markdown del contrato: genera tipos desde OpenAPI:

```bash
npx openapi-typescript https://minimalshopapi.up.railway.app/docs-json -o src/api/schema.d.ts
# o en local: http://localhost:8080/docs-json
```

Mantén `pagina`/`tamano` y códigos de error alineados con [05-CONTRATO-API.md](./05-CONTRATO-API.md).

## Checklist antes de release frontend

- [x] `CORS_ORIGINS` en Railway incluye el origen del frontend
- [x] Manejo de refresh token y 401
- [x] `Idempotency-Key` estable por intento de checkout (UUID v4)
- [x] Paginación en todos los listados
- [x] Mostrar `correlationId` en pantalla de error para soporte
- [x] No asumir pago confirmado hasta `GET pagos` o estado pedido `PAGADO`
- [x] Probar contra producción (`minimalshopapi.up.railway.app`) y/o seed local con `PAYMENT_PROVIDER=mock`
