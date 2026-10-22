# 00 — Estado obsoleto (archivo histórico)

> Este texto describe un prototipo **Spring Boot** que ya no está en el repositorio.
> No lo uses para operar la API. El runtime actual es NestJS + Prisma.
> Índice vigente: [docs/README.md](../README.md). Balance: [BALANCE-OPERATIVO.md](../BALANCE-OPERATIVO.md).

El documento original hablaba de un monolito modular Spring Boot (`./mvnw`, JPA, MySQL). Ese código se eliminó. Se conserva aquí solo como contexto de la decisión de stack.

## Qué se conservó como dominio

- Mapa de capacidades: catálogo, carrito, pedido, cupón, reseña, favorito, dirección, notificación, blog, evento, métricas, imágenes.
- Núcleo comercial: usuario → producto → carrito → pedido.
- Roles COMPRADOR / VENDEDOR (y SUPERADMIN en la API Nest).

## Qué se descartó

- `permitAll` en todas las rutas, contraseñas en texto plano, entidad JPA serializada como JSON.
- `ddl-auto` como migraciones, copiar archivos al directorio `src/`, contratos `Map<String, Object>`.
- Autorizar con el id de usuario que manda el cliente en la URL.

Las guías `09-NUCLEO-GUIA.md`, `06-CAMBIO-DE-ENFOQUE.md` y `07-CAMBIO-DE-STACK.md` que citaba el original **no existen**.
