# Documentación de remodelación — MinimalEcommerce API

Este directorio es la **fuente de verdad** para tratar el repositorio como una API obsoleta que hay que remodelar. El código en `src/` no se considera el diseño destino.

```mermaid
flowchart LR
  Obs["00 Estado obsoleto"]
  Arch["01 Arquitectura API"]
  Data["02 Modelo de datos"]
  Flow["03 Flujos"]
  Conn["04 Conexiones"]
  Api["05 Contrato HTTP"]
  Enf["06 Cambio de enfoque"]
  Stk["07 Cambio de stack"]
  Plan["08 Plan de remodelación"]

  Obs --> Arch
  Arch --> Data
  Data --> Flow
  Flow --> Conn
  Conn --> Api
  Api --> Enf
  Api --> Stk
  Enf --> Plan
  Stk --> Plan
```

## Cómo leerlo

1. Si vienes del código actual: empieza por [00-ESTADO-OBSOLETO.md](00-ESTADO-OBSOLETO.md) y los diagramas 01–04.
2. Si vas a **seguir en Spring** pero cambiar el diseño: [06-CAMBIO-DE-ENFOQUE.md](06-CAMBIO-DE-ENFOQUE.md) y [08-PLAN-REMODELACION.md](08-PLAN-REMODELACION.md).
3. Si vas a **cambiar de tecnología**: [07-CAMBIO-DE-STACK.md](07-CAMBIO-DE-STACK.md) (el contrato de [05](05-CONTRATO-API.md) es lo que hay que migrar o rediseñar).

Documentos históricos en la raíz (anteriores a esta carpeta):

- [../DOCUMENTACION.md](../DOCUMENTACION.md) — inventario detallado de clases y endpoints
- [../REESTRUCTURA.md](../REESTRUCTURA.md) — fallas y oleadas A/B/C
