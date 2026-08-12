# MinimalEcommerce

API REST de un marketplace mínimo (comprador / vendedor). Backend en **Java 17** y **Spring Boot 3.5.0**, persistencia en **MySQL**.

Este repositorio **no incluye frontend**. La API está pensada para un cliente en `http://localhost:3000` (u otro origen local). El estado actual es un **prototipo / aplicación base**: el dominio comercial está cubierto en código, pero la seguridad, el arranque de datos y la operación no están listos para producción.

Documentación adicional:

- [DOCUMENTACION.md](DOCUMENTACION.md) — análisis completo (función, core, arquitectura, endpoints, tecnologías)
- [REESTRUCTURA.md](REESTRUCTURA.md) — fallas, mejoras inmediatas y enfoque futuro

---

## Estado actual

| Aspecto | Situación |
|---|---|
| Tipo | Backend REST, puerto `8080` |
| Versión | `0.0.1-SNAPSHOT` |
| Núcleo comercial | Catálogo, carrito, checkout, pedidos, stock |
| Extensiones | Cupones, reseñas, favoritos, direcciones, preórdenes, notificaciones, blog, eventos, métricas de vendedor, imágenes |
| Autenticación | Login por email/contraseña **en texto plano**; sin JWT ni sesiones |
| Autorización | Todas las rutas están abiertas (`permitAll`) |
| Frontend | No está en este repositorio |
| Docker / CI | No hay |
| Tests | Un test de carga de contexto (`contextLoads`) |
| Documentación de API | SpringDoc OpenAPI / Swagger UI |

**Advertencia de seguridad:** no uses este proyecto tal cual en un entorno público. Las credenciales de MySQL están en `application.properties`, las contraseñas de usuario no se cifran al registrar, y cualquier cliente puede llamar a todos los endpoints.

---

## Requisitos

- JDK 17 o superior
- Maven (incluido el wrapper `./mvnw`)
- MySQL 8 escuchando en `localhost:3306`

La aplicación espera una base llamada `minimalecommerce`. Hibernate crea o actualiza tablas con `ddl-auto=update`.

---

## Arranque local

1. Crea la base (si no existe):

```sql
CREATE DATABASE IF NOT EXISTS minimalecommerce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

2. Configura conexión en `src/main/resources/application.properties` **o**, preferible, con variables de entorno / un perfil local que no se suba al repositorio:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/minimalecommerce?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=<tu-password>
```

No copies secretos al repositorio. El archivo actual ya contiene una contraseña en texto plano; trátala como deuda técnica (ver [REESTRUCTURA.md](REESTRUCTURA.md)).

3. Arranca:

```bash
./mvnw spring-boot:run
```

4. Comprueba:

| Recurso | URL |
|---|---|
| API | `http://localhost:8080/api/**` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` o `/swagger-ui/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |
| Imágenes de producto | `http://localhost:8080/imagenes-productos/<archivo>` |

### Datos semilla

`data.sql` inserta categorías y usuarios demo **solo si la tabla está vacía**, pero `spring.sql.init.mode=embedded` hace que **ese script no se ejecute contra MySQL**. Los archivos `data-nuevas-tablas.sql` y `data-nuevas-3-tablas.sql` tampoco se aplican solos. Si necesitas datos de prueba, ejecútalos a mano en MySQL.

Usuarios previstos en el seed (contraseña de aplicación, no de MySQL): `password123`

| Email | Rol |
|---|---|
| `comprador@minimalecommerce.com` | COMPRADOR |
| `vendedor@minimalecommerce.com` | VENDEDOR |
| `maria@test.com` | COMPRADOR |

Categorías previstas: Tecnología, Hogar, Moda, Mascotas, Manualidades.

---

## Módulos de la API

Prefijo común: `/api`.

| Prefijo | Responsabilidad |
|---|---|
| `/api/auth` | Login |
| `/api/usuarios` | Registro, login duplicado, CRUD, roles comprador/vendedor |
| `/api/productos` | Catálogo, stock, preorden, alta con imagen |
| `/api/categorias` | Categorías |
| `/api/carrito` | Carrito y checkout (`POST /procesar-pedido`) |
| `/api/pedidos` | Pedidos de comprador/vendedor y cambio de estado |
| `/api/pedidoitems` | Líneas de pedido |
| `/api/cupones` | Cupones de vendedor, validación y aplicación |
| `/api/resenas` | Reseñas de producto y estadísticas |
| `/api/favoritos` | Lista de deseos / toggle |
| `/api/direcciones` | Direcciones de entrega |
| `/api/preordenes` | Preórdenes de productos aún no disponibles |
| `/api/notificaciones` | Bandeja in-app |
| `/api/blogs` | Artículos |
| `/api/eventos` | Eventos / ferias |
| `/api/metricas-vendedor` | Métricas agregadas del vendedor |
| `/api/imagenes` | Subida y gestión de imágenes |

Detalle de endpoints, entidades y flujos: [DOCUMENTACION.md](DOCUMENTACION.md).

---

## Stack (resumen)

Java 17 · Maven Wrapper · Spring Boot 3.5.0 · Spring Web · Spring Data JPA / Hibernate · Spring Security · Spring Validation · MySQL Connector/J · Lombok · SpringDoc OpenAPI 2.1.0 · Spring Boot DevTools · JUnit 5

Lista completa y ausencias (Docker, JWT, Flyway, pagos, frontend): [DOCUMENTACION.md](DOCUMENTACION.md#tecnologías).

---

## Estructura del código

```
src/main/java/com/minimalecommerce/app/
  MinimalecommerceApplication.java
  config/       Security, CORS, recursos estáticos, OpenAPI
  controller/   17 controladores REST
  service/      16 servicios de negocio
  repository/   15 repositorios Spring Data JPA
  model/        Entidades JPA y enums
  exception/    GlobalExceptionHandler
src/main/resources/
  application.properties
  data.sql
  data-nuevas-tablas.sql
  data-nuevas-3-tablas.sql
  static/imagenes-productos/
```

Arquitectura: **Controller → Service → Repository → MySQL**. No hay DTOs: las entidades JPA se serializan directo en JSON.

---

## Limitaciones conocidas (estado actual)

- Contraseñas en texto plano; `PasswordEncoder` (BCrypt) está declarado y no se usa en el registro.
- Checkout acepta `cuponId` y **no aplica el descuento**.
- Alta de producto con imagen no asigna `vendedor` (campo obligatorio en la entidad).
- Subida de archivos escribe en `src/main/resources/...`; no funciona de forma fiable en un JAR.
- `target/` está versionado; no hay `.gitignore`.
- Un solo test; no hay CI.

Plan de corrección y reestructura: [REESTRUCTURA.md](REESTRUCTURA.md).
