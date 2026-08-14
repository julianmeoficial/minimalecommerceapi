# 04 — Conexiones del sistema actual

Cómo se conectan cliente, API, base de datos y archivos en el prototipo.

## Mapa de despliegue local

```mermaid
flowchart TB
  subgraph host [Maquina de desarrollo]
    Browser["Navegador / HTTP client"]
    FE["Frontend esperado :3000 NO esta en el repo"]
    JVM["JVM Spring Boot :8080"]
    MySQL["MySQL :3306"]
    SrcFiles["src/main/resources/static/imagenes-productos"]
  end

  Browser -->|"REST JSON"| JVM
  FE -.->|"CORS localhost:3000"| JVM
  Browser -->|"Swagger UI"| JVM
  JVM -->|"JDBC"| MySQL
  JVM -->|"GET classpath"| SrcFiles
  JVM -->|"POST Multipart write"| SrcFiles
```

No hay reverse proxy, TLS, ni red Docker. Un `docker-compose` no existe.

## CORS y orígenes

```mermaid
flowchart LR
  Props["application.properties allowed-origins localhost:8080"]
  Web["WebConfig allowedOriginPatterns localhost:* 127.0.0.1:* :3000"]
  Ctrl["@CrossOrigin en algunos controllers :3000"]
  Req["Request /api/**"]

  Req --> Web
  Req --> Ctrl
  Props -.->|no manda en /api| Web
```

En la remodelación: **un** sitio de CORS, lista de orígenes por perfil.

## Superficie de red de la API

```mermaid
flowchart TB
  In["Entrada TCP 8080"]
  In --> Api["/api/** REST"]
  In --> Docs["/swagger-ui/** y /v3/api-docs"]
  In --> Img["/imagenes-productos/**"]
  In --> Other["cualquier otra ruta permitAll"]

  Api --> JSON["application/json"]
  Api --> MP["multipart imagenes"]
```

Todo es público. No hay rate limit ni API key.

## Dependencias de runtime

```mermaid
flowchart TB
  Boot["spring-boot-starter-web Tomcat"]
  JPA["spring-boot-starter-data-jpa"]
  Sec["spring-boot-starter-security"]
  Val["spring-boot-starter-validation"]
  My["mysql-connector-j"]
  Oas["springdoc-openapi 2.1.0"]
  L["lombok compile"]
  Dev["devtools"]

  Boot --> App["MinimalecommerceApplication"]
  JPA --> App
  Sec --> App
  Val --> App
  My --> JPA
  Oas --> Boot
  L --> App
  Dev --> App
```

Ausentes: Redis, broker, cliente HTTP de pagos, S3 SDK, Flyway, JWT library (jjwt/nimbus).

## Confianza (modelo de amenaza actual)

```mermaid
flowchart LR
  Anyone["Cualquier cliente en la red"]
  Anyone --> AllApi["Todos los endpoints"]
  AllApi --> DB["Lectura y escritura MySQL"]
  AllApi --> Files["Escritura de archivos"]
  AllApi --> Roles["Cambio de tipousuario"]
```

Eso es inaceptable fuera de localhost. Cualquier stack o enfoque nuevo debe invertir este diagrama: el cliente **no** elige el `usuarioId`; lo emite el servidor tras autenticar.
