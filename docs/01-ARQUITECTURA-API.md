# 01 — Arquitectura actual de la API

Vista del **prototipo obsoleto**: un proceso Spring Boot, un módulo Maven, Tomcat embebido, MySQL local.

## Capas

```mermaid
flowchart TB
  Client["Cliente HTTP externo"]
  Swagger["SpringDoc /swagger-ui"]

  subgraph process [Proceso Spring Boot :8080]
    Filter["SecurityFilterChain permitAll CSRF off"]
    Ctrl["controller 17 clases"]
    Svc["service 16 clases"]
    Repo["repository 15 interfaces"]
    Model["model entidades JPA"]
    Ex["GlobalExceptionHandler"]
    Static["ResourceHandler imagenes-productos"]
  end

  MySQL["MySQL minimalecommerce"]
  Disk["Filesystem src/.../imagenes-productos"]

  Client --> Filter
  Client --> Swagger
  Swagger --> Ctrl
  Filter --> Ctrl
  Ctrl --> Svc
  Ctrl --> Static
  Ctrl --> Ex
  Svc --> Repo
  Repo --> Model
  Repo --> MySQL
  Static --> Disk
  Ctrl --> Disk
```

No hay API Gateway, ni capa de DTOs, ni cola, ni caché. El JSON de salida **es** el grafo Hibernate.

## Ciclo de un request típico

```mermaid
sequenceDiagram
  participant C as Cliente
  participant S as SecurityFilterChain
  participant Ctrl as Controller
  participant Svc as Service
  participant Repo as JpaRepository
  participant DB as MySQL

  C->>S: HTTP /api/...
  S->>Ctrl: permitAll
  Ctrl->>Svc: entidad o Map
  Svc->>Repo: find/save
  Repo->>DB: SQL Hibernate
  DB-->>Repo: filas
  Repo-->>Svc: entidad EAGER
  Svc-->>Ctrl: misma entidad
  alt RuntimeException
    Ctrl-->>C: 400 JSON timestamp message
  else OK
    Ctrl-->>C: 200 entidad o Map
  end
```

## Arranque y configuración

```mermaid
flowchart LR
  Main["MinimalecommerceApplication"]
  Props["application.properties"]
  Sec["SecurityConfig"]
  Web["WebConfig CORS y static"]
  Oas["SwaggerConfig"]
  JPA["Hibernate ddl-auto=update"]
  SQL["data.sql NO corre en MySQL"]

  Main --> Props
  Main --> Sec
  Main --> Web
  Main --> Oas
  Props --> JPA
  Props --> SQL
```

Puntos de fricción:

- CORS duplicado (`WebConfig` vs `spring.web.cors.*`).
- `spring.sql.init.mode=embedded` deja el seed inerte.
- OpenAPI 2.1.0 sobre Boot 3.5.0 (combinación desactualizada).
- Vistas HTML configuradas (`spring.mvc.view.prefix`) sin archivos.

## Paquetes Java actuales vs. destino

```mermaid
flowchart LR
  subgraph hoy [Hoy plano]
    C1["controller"]
    S1["service"]
    R1["repository"]
    M1["model"]
  end

  subgraph destino [Destino sugerido]
    Id["identity"]
    Cat["catalog"]
    Ord["ordering"]
    Pro["promotions"]
    Eng["engagement"]
    Cnt["content"]
  end

  C1 -.->|remodelar| destino
  S1 -.-> destino
  R1 -.-> destino
  M1 -.-> destino
```

El destino (módulos) se detalla en [06-CAMBIO-DE-ENFOQUE.md](06-CAMBIO-DE-ENFOQUE.md). No es obligatorio si se cambia de stack; el **contrato** sí: [05-CONTRATO-API.md](05-CONTRATO-API.md).
