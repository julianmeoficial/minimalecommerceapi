# MinimalEcommerce — esqueleto

Spring Boot vacío para **cambiar de arquitectura**. No hay controladores, ni capas controller/service/repository, ni dominio.

Memoria del prototipo y opciones de remodelación: **[docs/README.md](docs/README.md)**.

## Código vivo

| Pieza | Rol |
|---|---|
| `pom.xml` | Java 17 · Spring Boot 3.5 · Web · JPA · Security · Validation · MySQL · OpenAPI |
| `MinimalecommerceApplication` | Arranque |
| `SecurityConfig` | Evita el login por defecto de Spring Security; BCrypt disponible |
| `application.properties` | Puerto 8080; JPA/MySQL desconectados |

No hay `controller/`, `model/`, `service/`, `repository/`, CORS, Swagger propio ni handler de excepciones. Eso entra con la arquitectura nueva.

## Arranque

JDK 17. No hace falta MySQL.

```bash
./mvnw spring-boot:run
```

Tomcat en `http://localhost:8080` (sin rutas de negocio).

## Docs

[docs/09-NUCLEO-GUIA.md](docs/09-NUCLEO-GUIA.md) describe este esqueleto. El resto de `docs/` es histórico / plan.
