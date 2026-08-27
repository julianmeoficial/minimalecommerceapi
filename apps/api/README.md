# apps/api

Aplicación NestJS del monolito MinimalEcommerce.

Documentación del producto, arquitectura, flujos y contrato:

- [README raíz](../../README.md)
- [docs/](../../docs/README.md)
- [CONTRIBUTING](../../CONTRIBUTING.md)

## Comandos locales

```bash
# desde la raíz del repo
pnpm --filter api start:dev
pnpm --filter api test:e2e
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
```

OpenAPI: http://localhost:8080/docs
