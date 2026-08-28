# 07 — Desarrollo

## Scripts (raíz)

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala el workspace |
| `pnpm dev` | Nest en watch (`apps/api`) |
| `pnpm build` | Compila la API |
| `pnpm start` | Arranque producción (`dist`) |
| `pnpm test` | Unitarios |
| `pnpm test:e2e` | E2E marketplace |
| `pnpm prisma:generate` | Genera Prisma Client |
| `pnpm prisma:migrate` | `prisma migrate dev` |
| `pnpm prisma:seed` | Seed de desarrollo |

En `apps/api` también: `start:dev`, `prisma:migrate`, `prisma:seed`, `test:e2e`.

## Variables de entorno

Copia `.env.example` → `.env` (nunca commitear secretos).

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Postgres (local o Supabase) |
| `JWT_SECRET` | sí | ≥ 32 caracteres en prod |
| `JWT_EXPIRES_IN` | no | Default `1d` |
| `REDIS_URL` | sí* | BullMQ (`redis://localhost:6379`) |
| `PORT` | no | Default `8080` |
| `CORS_ORIGINS` | no | Lista separada por comas |
| `MEDIA_DRIVER` | no | `local` \| `supabase` |
| `UPLOAD_DIR` | no | Default `./uploads` |
| `SUPABASE_*` | si media supabase | URL, service role, bucket |
| `STRIPE_SECRET_KEY` | no | Vacío → mock de pagos |

\*Requerida para notificaciones; el checkout responde aunque el worker falle después.

## Migraciones y seed

```bash
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
```

Usuarios demo: `comprador@demo.com`, `vendedor@demo.com`, `admin@demo.com` / `demo12345`.
Cupón: `WELCOME10`.

## OpenAPI (Swagger)

| Recurso | URL |
|---|---|
| UI | https://localhost:8080/docs |
| Spec JSON | https://localhost:8080/docs-json |

La UI vive en la raíz (`/docs`), no bajo `/api/v1`.

### TLS local y Safari

```bash
pnpm certs:dev   # genera apps/api/certs/*.pem (gitignored)
pnpm dev         # detecta certificados → HTTPS en :8080
```

#### ¿Por qué Safari se comporta distinto?

Safari prioriza la **privacidad y la seguridad del usuario** de forma más estricta que muchos
navegadores basados en Chromium. En desarrollo local eso se nota de dos maneras:

1. **Página en blanco con HTTP** — si Helmet envía `upgrade-insecure-requests`, Safari intenta cargar
   los assets de Swagger por HTTPS aunque el servidor solo escuche HTTP.
2. **Aviso al usar HTTPS local** — con `pnpm certs:dev` la API usa un certificado **autofirmado**
   (válido solo en tu máquina). Safari no lo reconoce como emitido por una autoridad de confianza y
   muestra una pantalla de advertencia antes de dejarte entrar.

Ese aviso **es esperado y, en general, es bueno**: protege ante sitios que fingen ser seguros. En
localhost el riesgo real es mínimo porque el tráfico no sale de tu equipo; aun así, Safari te pide
confirmación explícita. Puede resultar molesto cuando solo quieres ver Swagger, pero refleja el
enfoque de Apple en no asumir que “local” implica “seguro de confiar”.

#### Cómo abrir Swagger en Safari

1. Arranca la API con certificados (`pnpm certs:dev` + `pnpm dev`).
2. Abre **https://localhost:8080/docs** (con `https://`).
3. En la pantalla de advertencia: **Mostrar detalles** → **visitar este sitio web** (o equivalente
   según tu versión de macOS). Siempre puedes **aceptar el riesgo e ir igual**; es tu entorno local.
4. Opcional: vacía caché (**Develop → Empty Caches**) si antes probaste la URL en HTTP.

Para evitar el aviso en cada máquina puedes usar [mkcert](https://github.com/FiloSottile/mkcert)
(`mkcert -install` + regenerar los `.pem`); no es obligatorio para desarrollo.

#### Safari en blanco (HTTP sin TLS)

**Síntoma:** Chromium carga Swagger; Safari muestra página vacía en `http://localhost:8080/docs`.

**Causa:** Helmet CSP con `upgrade-insecure-requests` (Safari fuerza HTTPS en assets).

**Solución:** `pnpm certs:dev` + **https://** … o, en desarrollo, Helmet desactiva esa directiva
(`upgradeInsecureRequests: null` — borrar solo la clave kebab no basta con Helmet 8).

Tras cambios, reinicia `pnpm dev` y vacía caché en Safari si hace falta.

## Tests

```bash
# Unitarios (pueden pasar sin DB)
pnpm test

# E2E — necesita Postgres + Redis alcanzables con .env
pnpm test:e2e
```

El suite `marketplace.e2e-spec.ts` cubre: registro, 401, RBAC 403, cupón aplicado, stock insuficiente, cupón inválido, intent+confirm de pago → `PAGADO`.

Hay un helper de Testcontainers (`test/testcontainers.*`) que se omite si Docker no está disponible; en CI se usan los servicios del workflow.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml): install → `prisma migrate deploy` → unit → e2e marketplace → build → `docker build`.

## Checklist antes de un PR

1. `pnpm --filter api build` OK  
2. E2E verde si tocaste auth / cart / orders / payments / coupons  
3. OpenAPI sigue coherente (DTOs anotados)  
4. Entrada en `CHANGELOG.md` bajo `[Unreleased]` si el cambio es visible  
5. Sin secretos en el diff  
