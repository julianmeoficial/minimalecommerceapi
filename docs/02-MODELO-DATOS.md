# 02 — Modelo de datos y conexión a MySQL

Hibernate es el dueño del esquema (`ddl-auto=update`). No hay Flyway. Las tablas se llaman como las entidades, en minúsculas.

## Conexión actual

```mermaid
flowchart TB
  App["Spring Boot"]
  DS["Datasource JDBC"]
  URL["jdbc:mysql://localhost:3306/minimalecommerce"]
  Flags["createDatabaseIfNotExist useSSL=false allowPublicKeyRetrieval"]
  Hib["SessionFactory ddl-auto=update"]
  DB["MySQL 8"]

  App --> DS
  DS --> URL
  URL --> Flags
  App --> Hib
  Hib --> DB
  DS --> DB
```

Credenciales: `spring.datasource.username` / `password` en `application.properties` (secretos en git). Driver: `mysql-connector-j`.

## Diagrama entidad-relación (prototipo)

```mermaid
erDiagram
  USUARIO ||--o{ PRODUCTO : vende
  CATEGORIA ||--o{ PRODUCTO : clasifica
  USUARIO ||--o{ CARRITOITEM : tiene
  PRODUCTO ||--o{ CARRITOITEM : en
  USUARIO ||--o{ PEDIDO : compra
  PEDIDO ||--|{ PEDIDOITEM : contiene
  PRODUCTO ||--o{ PEDIDOITEM : linea
  USUARIO ||--o{ CUPON : crea
  USUARIO ||--o{ RESENA : escribe
  PRODUCTO ||--o{ RESENA : recibe
  USUARIO ||--o{ FAVORITO : marca
  PRODUCTO ||--o{ FAVORITO : es
  USUARIO ||--o{ DIRECCION : posee
  USUARIO ||--o{ PREORDEN : solicita
  PRODUCTO ||--o{ PREORDEN : reserva
  USUARIO ||--o{ NOTIFICACION : recibe
  USUARIO ||--o{ BLOG : autor
  CATEGORIA ||--o{ BLOG : tema
  USUARIO ||--o{ EVENTO : organiza
  USUARIO ||--o{ METRICAVENDEDOR : agrega

  USUARIO {
    long id PK
    string email UK
    string password
    string tipousuario
    boolean activo
  }
  PRODUCTO {
    long id PK
    long categoriaid FK
    long vendedorid FK
    decimal precio
    int stock
    string imagen
    boolean espreorden
    boolean activo
  }
  CATEGORIA {
    long id PK
    string nombre UK
  }
  CARRITOITEM {
    long id PK
    long usuarioid FK
    long productoid FK
    int cantidad
    decimal preciounitario
  }
  PEDIDO {
    long id PK
    long usuarioid FK
    decimal total
    string estado
    string direccionentrega
  }
  PEDIDOITEM {
    long id PK
    long pedidoid FK
    long productoid FK
    int cantidad
    decimal preciounitario
  }
  CUPON {
    long id PK
    string codigo UK
    string tipo
    decimal valor
    int usosmaximo
    int usosactuales
    long creadorid FK
  }
  RESENA {
    long id PK
    long usuarioid FK
    long productoid FK
    int calificacion
  }
  FAVORITO {
    long id PK
    long usuarioid FK
    long productoid FK
  }
  DIRECCION {
    long id PK
    long usuarioid FK
    boolean principal
  }
  PREORDEN {
    long id PK
    long usuarioid FK
    long productoid FK
    string estado
  }
  NOTIFICACION {
    long id PK
    long usuarioid FK
    string tipo
  }
  BLOG {
    long id PK
    long autorid FK
    long categoriaid FK
  }
  EVENTO {
    long id PK
    long usuarioid FK
  }
  METRICAVENDEDOR {
    long id PK
    long vendedorid FK
    date fecha
  }
```

## Núcleo vs. satélites

```mermaid
flowchart TB
  subgraph nucleo [Nucleo comercial]
    U[USUARIO]
    P[PRODUCTO]
    Cat[CATEGORIA]
    C[CARRITOITEM]
    Ped[PEDIDO]
    Pi[PEDIDOITEM]
  end

  subgraph sat [Satelites]
    Cup[CUPON]
    R[RESENA]
    F[FAVORITO]
    D[DIRECCION]
    Pre[PREORDEN]
    N[NOTIFICACION]
    B[BLOG]
    E[EVENTO]
    M[METRICAVENDEDOR]
  end

  U --> C
  P --> C
  Cat --> P
  U --> P
  U --> Ped
  Ped --> Pi
  P --> Pi
  U --> Cup
  U --> R
  P --> R
  U --> F
  P --> F
  U --> D
  U --> Pre
  P --> Pre
  U --> N
  U --> B
  Cat --> B
  U --> E
  U --> M
```

## Fetch y serialización

Casi todas las `@ManyToOne` son `EAGER`. Un GET de carrito arrastra producto, categoría, vendedor (usuario con password). `Cupon.creador` es la excepción (`LAZY` + `@JsonIgnore`).

En la API remodelada: entidades **no** salen por HTTP; el modelo de persistencia puede seguir parecido, el contrato no.

## Seed

| Script | Intención | Realidad |
|---|---|---|
| `data.sql` | Categorías + 3 usuarios | No corre (`init.mode=embedded`) |
| `data-nuevas-tablas.sql` | Pedido dummy total 0 | Manual |
| `data-nuevas-3-tablas.sql` | Eventos y blogs | Manual |

Cualquier stack nuevo debe sustituir esto por migraciones versionadas + seed de desarrollo explícito.
