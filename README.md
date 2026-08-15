# MinimalEcommerce — API REST (estado obsoleto)

> **Este estado del proyecto está obsoleto.** El código en `src/` es un prototipo de API Spring Boot que **requiere remodelación, reestructura y un nuevo planteamiento**. No es un producto, no es un frontend y no debe desplegarse tal cual.
>
> Documentación canónica de la remodelación: **[docs/README.md](docs/README.md)**.

---

## Qué es este repositorio ahora

Este repo se trata como **API HTTP** de un marketplace mínimo (comprador / vendedor), no como aplicación completa.

| | |
|---|---|
| Contrato | REST bajo `/api/**` en el puerto `8080` |
| Runtime actual | Java 17 · Spring Boot 3.5.0 · MySQL |
| Clientes | Ninguno en este repo (se esperaba un frontend en `:3000`) |
| Versión | `0.0.1-SNAPSHOT` — prototipo |

Inventario de endpoints, entidades y stack: [DOCUMENTACION.md](DOCUMENTACION.md) (histórico).  
Fallas y oleadas de arreglo: [REESTRUCTURA.md](REESTRUCTURA.md) (histórico).  
**Diagramas, obsolescencia, cambio de enfoque y cambio de stack:** [docs/](docs/README.md).

---

## Índice de la remodelación

| Documento | Para qué |
|---|---|
| [docs/00-ESTADO-OBSOLETO.md](docs/00-ESTADO-OBSOLETO.md) | Por qué este código ya no es el destino |
| [docs/01-ARQUITECTURA-API.md](docs/01-ARQUITECTURA-API.md) | Capas, ciclo de un request, OpenAPI |
| [docs/02-MODELO-DATOS.md](docs/02-MODELO-DATOS.md) | ER de MySQL y conexiones JPA |
| [docs/03-FLUJOS.md](docs/03-FLUJOS.md) | Auth, catálogo, carrito/checkout, imágenes |
| [docs/04-CONEXIONES.md](docs/04-CONEXIONES.md) | Cliente ↔ API ↔ BD ↔ estáticos |
| [docs/05-CONTRATO-API.md](docs/05-CONTRATO-API.md) | Superficie HTTP a preservar o rediseñar |
| [docs/06-CAMBIO-DE-ENFOQUE.md](docs/06-CAMBIO-DE-ENFOQUE.md) | Si se cambia el enfoque (modular, micro, BaaS) |
| [docs/07-CAMBIO-DE-STACK.md](docs/07-CAMBIO-DE-STACK.md) | Si se cambia el stack (Node, .NET, Go, serverless) |
| [docs/08-PLAN-REMODELACION.md](docs/08-PLAN-REMODELACION.md) | Oleadas de remodelación |
| [docs/09-NUCLEO-GUIA.md](docs/09-NUCLEO-GUIA.md) | Código que queda en `src/` (guía) |

---

## Arranque del prototipo (solo referencia)

Sigue siendo útil para inspeccionar el comportamiento actual. **No es el objetivo de producción.**

Requisitos: JDK 17, Maven Wrapper, MySQL 8 en `localhost:3306`.

```bash
./mvnw spring-boot:run
```

| Recurso | URL |
|---|---|
| API | `http://localhost:8080/api/**` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI | `http://localhost:8080/v3/api-docs` |

La conexión MySQL está en `src/main/resources/application.properties` (`MYSQL_PASSWORD` o valor de guía). El seed `data.sql` es manual (`spring.sql.init.mode=never`).

**Seguridad:** todas las rutas están abiertas (`permitAll`), las contraseñas van en texto plano, no hay JWT.

---

## Módulos HTTP actuales (superficie)

`/api/auth` · `/api/usuarios` · `/api/productos` · `/api/categorias` · `/api/carrito` · `/api/pedidos`

Los módulos satélite (cupones, reseñas, blog, eventos, etc.) se eliminaron del código. Detalle: [docs/09-NUCLEO-GUIA.md](docs/09-NUCLEO-GUIA.md).
