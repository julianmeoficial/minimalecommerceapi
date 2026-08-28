# Documentación — MinimalEcommerce API

Documentación operativa del backend actual (NestJS). Empieza por el [README de la raíz](../README.md) para arrancar; aquí está el detalle.

## Índice

| Doc | Contenido |
|---|---|
| [01 — Arquitectura](01-ARQUITECTURA-API.md) | Monolito modular, stack, request path |
| [02 — Modelo de datos](02-MODELO-DATOS.md) | Prisma, ER, enums, núcleo vs satélites |
| [03 — Flujos](03-FLUJOS.md) | Auth, catálogo, checkout, pagos, eventos |
| [04 — Conexiones](04-CONEXIONES.md) | Despliegue local, Redis, Supabase, Stripe |
| [05 — Contrato HTTP](05-CONTRATO-API.md) | Superficie `/api/v1`, errores, paginación |
| [06 — Estructura del repo](06-ESTRUCTURA.md) | Árbol de archivos y módulos |
| [07 — Desarrollo](07-DESARROLLO.md) | Scripts, seed, tests, variables de entorno |
| [08 — Supabase](08-SUPABASE.md) | Conectar Postgres/Storage de Supabase |

También: [CHANGELOG](../CHANGELOG.md) · [CONTRIBUTING](../CONTRIBUTING.md)

## Principios

1. El contrato HTTP y los diagramas describen **lo que hay en el código**, no un plan futuro.
2. Las entidades Prisma no salen por HTTP: siempre DTOs.
3. OpenAPI en `/docs` es la fuente viva de schemas de request/response.
