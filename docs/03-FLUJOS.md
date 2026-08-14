# 03 — Flujos actuales de la API

Flujos del prototipo. Los huecos (líneas punteadas) son parte de la obsolescencia.

## Autenticación (insegura)

Hay **dos** logins incompatibles.

```mermaid
sequenceDiagram
  participant C as Cliente
  participant Auth as AuthController
  participant Usr as UsuarioController
  participant Svc as UsuarioService
  participant DB as MySQL

  alt POST /api/auth/login
    C->>Auth: email password
    Auth->>Svc: authenticateUser
    Svc->>DB: findByEmail
    Svc->>Svc: password.equals plano
    Auth-->>C: user con password null
  else POST /api/usuarios/login
    C->>Usr: email password
    Usr->>Svc: login
    Svc->>DB: findByEmailAndPassword JPQL
    Usr-->>C: usuario CON password
  end
```

No hay token. El cliente reenvía `usuarioId` en cada llamada. Cualquiera puede usar el id de otro.

## Catálogo y alta con imagen

```mermaid
flowchart TD
  Get["GET /api/productos"] --> Activos["findByActivoTrue"]
  PostJson["POST /api/productos JSON"] --> Crear["ProductoService.crearProducto"]
  Crear --> CatCheck["Categoria debe existir"]
  CatCheck --> Save["save Hibernate"]
  Multipart["POST /api/productos/crear-con-imagen"] --> Copy["Files.copy a src/static"]
  Copy --> Crear2["crearProducto"]
  Crear2 -.->|no asigna vendedor| Save2["save puede fallar NOT NULL vendedorid"]
```

## Carrito y checkout (core)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant Cart as CarritoitemController
  participant Svc as CarritoitemService
  participant DB as MySQL

  C->>Cart: POST /api/carrito/agregar
  Cart->>Svc: usuarioId productoId cantidad
  Svc->>DB: stock y linea existente
  Svc-->>Cart: Carritoitem
  Cart-->>C: 200

  C->>Cart: POST /api/carrito/procesar-pedido
  Note over Cart: lee cuponId
  Cart->>Svc: procesarPedido usuarioId direccion cuponId
  Note over Svc: cuponId NO se usa
  Svc->>DB: validar stock
  Svc->>DB: INSERT pedido PENDIENTE
  Svc->>DB: INSERT pedidoitem
  Svc->>DB: UPDATE producto.stock
  Svc->>DB: DELETE carrito del usuario
  Svc-->>C: pedido items subtotal
```

```mermaid
stateDiagram-v2
  [*] --> PENDIENTE: checkout
  PENDIENTE --> CONFIRMADO: PUT estado
  CONFIRMADO --> ENVIADO: PUT estado
  ENVIADO --> ENTREGADO: PUT estado
  PENDIENTE --> CANCELADO: cancelar
  CONFIRMADO --> CANCELADO: cancelar
  ENVIADO --> CANCELADO: cancelar
  ENTREGADO --> [*]: no cancelable
```

No hay estado de pago. El cambio de estado no comprueba que el llamador sea el vendedor del SKU.

## Cupón (módulo huérfano respecto al cobro)

```mermaid
flowchart LR
  CRUD["CRUD /api/cupones"] --> Valid["validar vigencia usos"]
  Valid --> Aplicar["POST /aplicar incrementa usos"]
  Checkout["POST /carrito/procesar-pedido"] -.->|cuponId ignorado| Total["total = suma lineas"]
```

## Imágenes

```mermaid
flowchart TB
  Up["POST /api/imagenes/subir"] --> Svc["ImagenService"]
  Svc --> PathA["user.dir/backend/src/..."]
  PathA -->|no existe| PathB["user.dir/src/main/resources/static/imagenes-productos/"]
  PathB --> UUID["UUID + extension"]
  Get["GET /imagenes-productos/file"] --> Classpath["classpath:/static/imagenes-productos/"]
```

Subida y lectura no comparten garantía de path; en un JAR la escritura al árbol `src/` no aplica.

## Preorden y métricas (desconectadas del core)

```mermaid
flowchart LR
  Pre["Preorden estados propios"] -.->|no convierte| Ped["Pedido"]
  Ped -.->|no dispara| Met["Metricavendedor"]
  Met["POST .../actualizar"] --> Tabla["Filas agregadas a mano"]
```

Estos flujos son el mapa a **rediseñar** (eventos de dominio `OrderPlaced`, conversión preorden→pedido, proyección de métricas), no a copiar línea a línea. Plan: [08-PLAN-REMODELACION.md](08-PLAN-REMODELACION.md).
