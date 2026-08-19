# MinimalEcommerce — bases de la API

Esqueleto Spring Boot para **reconstruir** el marketplace. El dominio anterior (usuarios, catálogo, carrito, pedidos y satélites) **ya no está en `src/`**.

Documentación de lo que había y cómo remodelar: **[docs/README.md](docs/README.md)**.

## Qué queda en código

| Pieza | Rol |
|---|---|
| `pom.xml` | Java 17, Spring Boot 3.5, Web, JPA, Security, Validation, MySQL, OpenAPI |
| `MinimalecommerceApplication` | Arranque |
| `config/` | Security (`permitAll` + BCrypt listo), CORS, Swagger |
| `exception/` | Handler global |
| `GET /api/health` | Único endpoint vivo |
| `application.properties` | Puerto 8080; JPA/MySQL comentados hasta que exista dominio |

Paquetes `model/`, `repository/` y `service/` están vacíos a propósito: ahí va la reconstrucción.

## Arranque

JDK 17 y Maven Wrapper. **No hace falta MySQL** hasta activar JPA.

```bash
./mvnw spring-boot:run
```

| Recurso | URL |
|---|---|
| Salud | `http://localhost:8080/api/health` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI | `http://localhost:8080/v3/api-docs` |

Al añadir entidades: quitar `spring.autoconfigure.exclude` y descomentar el datasource en `application.properties`.

## Docs

Histórico y plan (el código vivo ya no implementa esos flujos): [docs/](docs/README.md). Lo que hay ahora en `src/`: [docs/09-NUCLEO-GUIA.md](docs/09-NUCLEO-GUIA.md).
