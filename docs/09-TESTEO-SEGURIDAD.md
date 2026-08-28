# 09 — Testeo de seguridad

Auditoría **defensiva** de la API actual: cómo se comporta frente a abusos habituales
(autenticación, autorización, validación, subida de archivos, pagos). No es un pentest
ofensivo ni un informe de exploits; el objetivo es comprobar que los controles existentes
responden bien y endurecer lo que falle.

Re-ejecutar:

```bash
pnpm test                 # unitarios (JWT, mock de pagos)
pnpm test:e2e -- --testPathPattern=security
pnpm test:e2e -- --testPathPattern=marketplace
```

En CI (`.github/workflows/ci.yml`) corren ambos e2e además de unitarios y build.

## Alcance

| Incluido | Fuera de alcance |
|---|---|
| Auth JWT, RBAC, validación de DTOs | Infra de Supabase / Redis gestionada |
| IDOR entre compradores | Ingeniería social, phishing |
| Upload de imágenes, path de media | Ataques a terceros (Stripe real) |
| Mock de pagos en producción | DDoS de red / L7 masivo |
| Cabeceras Helmet / CORS / throttle (código) | Secretos ya rotados en el dashboard |

El registro público como `VENDEDOR` es **decisión de producto** del marketplace (auto-alta de
vendedores). Lo que sí se bloquea es auto-registrarse como `SUPERADMIN`.

## Cómo se testeó

1. Revisión del código (guards globales, DTOs, Prisma, Helmet, Stripe).
2. Tests e2e en `apps/api/test/security.e2e-spec.ts`: peticiones HTTP que **deben fallar**
   (401, 403, 400, 404) sin payloads de exploit.
3. Unitarios de `requireJwtSecret` y del mock de Stripe (fail-closed en `production`).

Mapeo informal a [OWASP API Security](https://owasp.org/API-Security/):

| Tema | Qué comprobamos | Resultado |
|---|---|---|
| Broken Object Level Authorization | Pedido y dirección de otro usuario | 403 / 404 — OK |
| Broken Authentication | JWT vacío/malformado; `JWT_SECRET` corto o placeholder | 401; arranque falla si el secreto es inválido |
| Broken Object Property Authorization | Campos extra (`role`, `passwordHash`) en `PUT /me` | 400 (`forbidNonWhitelisted`) |
| Unrestricted Resource Consumption | Throttle extra en login/register (10 / 60 s); límite 5 MB en imágenes | Código endurecido |
| Broken Function Level Authorization | Comprador crea producto/categoría; flags; estado de pedido | 403 |
| Unrestricted Access to Sensitive Business Flows | Mock Stripe que confirma pagos | Mock **prohibido** si `NODE_ENV=production` |
| SSRF / uploads | Solo MIME de imagen; extensión derivada del MIME, no del nombre | 400 si no es imagen |
| Security misconfiguration | Swagger desactivado en production salvo `SWAGGER_ENABLED=true`; Helmet en `main.ts` | Documentado |

## Hallazgos y correcciones (esta rama)

### Corregidos

| Severidad | Hallazgo | Corrección |
|---|---|---|
| Alta | `JWT_SECRET` caía a `'dev-secret'` si faltaba la env | `requireJwtSecret()` (≥ 32 caracteres; placeholders prohibidos en production) |
| Alta | Mock de Stripe confirmaba cualquier pago sin clave | Fail-closed en production (`PAYMENTS_UNAVAILABLE` 503) |
| Media | `FileInterceptor` sin límite ni filtro MIME | Allow-list JPEG/PNG/WebP/GIF, máx. 5 MB |
| Media | Nombre original del archivo podía definir la extensión | Extensión según `Content-Type` |
| Media | Swagger `/docs` siempre público | Solo fuera de production, o con `SWAGGER_ENABLED=true` |
| Media | Login/register compartían el bucket global (120/min) | `@Throttle` 10 req / 60 s en esos endpoints |
| Baja | Mutaciones de catálogo sin `@Roles` (solo chequeo en servicio) | `@Roles(VENDEDOR, SUPERADMIN)` en controlador |
| Baja | `PUT /orders/:id/status` igual | `@Roles` en controlador |
| Baja | Registro exigía `role` en el body | Opcional; default `COMPRADOR`; `SUPERADMIN` sigue bloqueado |

### Aceptados (riesgo consciente)

| Tema | Por qué se deja |
|---|---|
| Auto-registro `VENDEDOR` | El marketplace permite vendedores self-service; el e2e y el seed lo usan |
| RLS con `USING (true)` | Prisma conecta como owner; RLS es barrera extra para clientes con anon key, no para este backend |
| Rate limit global 120/min | Suficiente para dev; en producción conviene un proxy (CDN / WAF) |
| Sin webhook Stripe firmado | `STRIPE_WEBHOOK_SECRET` está en `.env.example` pero no hay endpoint; el flujo actual es intent + confirm autenticado |
| Health y catálogo públicos | Intencional |

### Residual

- Detrás de un reverse proxy hay que configurar `trust proxy` para que el throttle vea la IP real.
- Rotar `JWT_SECRET` si alguna vez se usó el fallback `dev-secret` o el valor de `.env.example` en un entorno compartido.
- Confirmar en el dashboard de Supabase que la *anon key* no se usa como conexión de Prisma (sigue siendo el owner).

## Safari y HTTPS local

Safari aplica CSP y TLS con más rigor que Chromium. Eso **no es una vulnerabilidad de la API**:
es privacidad del navegador. En localhost, el aviso de certificado autofirmado se puede aceptar
para abrir Swagger (`https://localhost:8080/docs`). Detalle: [07-DESARROLLO](07-DESARROLLO.md#tls-local-y-safari).

## Cabeceras (Helmet)

Helmet se monta en `main.ts` (no en el e2e, que instancia `AppModule` sin bootstrap). En el
proceso `pnpm dev` deben verse, entre otras: `Content-Security-Policy`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options`. En development se omite
`upgrade-insecure-requests` para no romper Safari en HTTP.
