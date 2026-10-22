# Resultados de pruebas — MinimalShop API

Última ejecución documentada: **2026-10-22**.

- **E2E / unitarias documentadas aquí:** Postgres local `minimalshop_e2e` (`127.0.0.1:5432`) y Redis `127.0.0.1:6379`.
- **Schema remoto:** el mismo día, `prisma migrate deploy` + `db seed` corrieron OK contra MinimalShop_API (Monica_BK, Session pooler `us-east-1`). Ver [BALANCE-OPERATIVO.md](BALANCE-OPERATIVO.md).

## Resumen

| Capa | Herramienta | Suites | Tests | Estado |
|------|-------------|--------|-------|--------|
| Unitarias (`src/**/*.spec.ts`) | Jest | 9 | 19 | 8 suites OK; 1 suite no arranca |
| Integración e2e (`test/fase5.e2e-spec.ts`) | Jest + Supertest | 1 | 7 | ✅ OK |
| Salud + ingreso demo | curl contra la API en `:8081` | — | — | ✅ `/api/salud/vida`, `/api/salud/listo`, `POST /api/v1/auth/ingreso` |

`pnpm test` falla al cargar `apps/api/src/modules/payments/stripe.gateway.spec.ts` (importa `./stripe.gateway`, que no existe). Es un resto en inglés; no entra en la cobertura de dominio. Los 19 tests de las otras suites pasan. `pnpm test:e2e` solo corre `fase5.e2e-spec.ts`.

## Unitarias

Comando:

```bash
cd apps/api && pnpm exec jest --watchman=false --coverage
```

**Cobertura (solo `modulos/**/dominio/`, umbral CI):** líneas ~72 % global en dominio; módulos destacados:

| Módulo | Archivo | Líneas |
|--------|---------|--------|
| pedidos | `maquina-estados.ts`, `totales.ts` | ~90–100 % |
| carrito | `resumen.ts` | 100 % |
| complementarios | `cupon.ts` | ~67 % |
| usuarios | `refresh-token.ts` | ~77 % |

**Suites incluidas:**

- `maquina-estados.spec.ts` — transiciones del ciclo 8.4
- `totales.spec.ts` — cálculo de montos
- `resumen.spec.ts` — carrito comprable
- `cupon.spec.ts` — descuentos
- `refresh-token.spec.ts` — formato y hash de refresh
- `politica-propiedad-pedido.spec.ts` — actores comprador/vendedor
- `cobros.service.spec.ts` — inicio de cobro (doble de pasarela)
- `jwt-secret.spec.ts` — anillo de claves JWT
- `stripe.gateway.spec.ts` — **no corre**: módulo `./stripe.gateway` ausente

Umbrales en `apps/api/package.json` (cobertura global sobre dominio): líneas/declaraciones ≥ 55 %, funciones ≥ 40 %, ramas ≥ 10 %.

## E2E (Fase 5)

Comando:

```bash
cd apps/api
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://localhost:6379
pnpm test:e2e
```

`global-setup-e2e.ts` ejecuta `prisma migrate deploy`. Si `DATABASE_URL` ya está definida (CI o local), no se usa Testcontainers.

| Caso | Descripción |
|------|-------------|
| CU-01 | `GET /api/v1/catalogo/productos` y detalle de producto |
| EAC-03 | 401 sin token en vendedor; 403 comprador creando producto |
| CU-03 | Carrito → `POST /api/v1/pedidos` con `Idempotency-Key` e idempotencia |
| CU-04 | `POST .../pagos/pedidos/:id/intento` + simulador `.../aprobar` (`PAYMENT_PROVIDER=mock`) |
| CU-09 | Vendedor `PATCH /api/v1/vendedor/pedidos/:id/estado` → `EN_PREPARACION`, `ENVIADO` |
| Salud | `GET /api/salud/vida` |

## CI (GitHub Actions)

Workflow `.github/workflows/ci.yml`:

1. **Gitleaks** — escaneo de secretos en el repositorio  
2. `prisma migrate deploy`  
3. Jest unitario con `--coverage`  
4. E2E `pnpm test:e2e`  
5. `nest build` + imagen Docker  

Variables de prueba: `PAYMENT_PROVIDER=mock`, `TRABAJOS_PROGRAMADOS=false`, límites de throttling elevados.

## Cómo reproducir en local

El e2e usa `DATABASE_URL` del entorno. Si `apps/api/.env` apunta a Supabase, exporta una URL local antes de `pnpm test:e2e` para no mezclar datos de prueba con Monica_BK.

```bash
# Postgres y Redis locales (Docker o los que ya escuchen en 5432/6379)
export DATABASE_URL=postgresql://USER@127.0.0.1:5432/minimalshop_e2e?schema=public
export REDIS_URL=redis://127.0.0.1:6379
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm test
pnpm test:e2e
```
