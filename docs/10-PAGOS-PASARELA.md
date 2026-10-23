# 10 — Pasarela de pagos

El checkout no habla con un proveedor concreto. Habla con el puerto [`PasarelaPagos`](../apps/api/src/modulos/pagos/aplicacion/pasarela-pagos.ts): crear intento, consultar, cancelar y verificar webhook.

`CobrosService` persiste el pago y mueve el pedido. El factory de [`pagos.module.ts`](../apps/api/src/modulos/pagos/pagos.module.ts) elige el adaptador y lo envuelve en `PasarelaResiliente`.

## Adaptadores

| `PAYMENT_PROVIDER` | Clase | Estado |
|---|---|---|
| `mock` (default) | `SimuladaPasarela` | Activo. Simulador HTTP de superadmin, también con `NODE_ENV=production`. |
| `stripe` | `StripePasarela` | Opcional. Exige `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`. |
| `wompi` | — | Futuro (Colombia). No está en Joi: un valor desconocido hoy cae en `mock`. |

No hay cliente que “confirme” el pago. El cierre llega por webhook del proveedor o por el simulador.

## Flujo

1. `POST /api/v1/pagos/pedidos/:id/intento` → `crearIntento`.
2. Cierre universitario: superadmin `POST /api/v1/pagos/simulador/pedidos/:id/aprobar` o `.../rechazar` (solo si `PAYMENT_PROVIDER=mock`).
3. Cierre Stripe: `POST /api/v1/pagos/webhook` con cabecera `stripe-signature`.
4. `GET /api/v1/pagos/pedidos/:id` para el estado.

Moneda por defecto: `PAYMENT_CURRENCY=usd`. Wompi en Colombia usará `cop`.

## Integrar Wompi (cuando toque)

1. Implementar `WompiPasarela extends PasarelaPagos` (intento, consulta, cancelación, firma del webhook).
2. Añadir el `case 'wompi'` en `seleccionarPasarela` y registrar el provider en el módulo. No hace falta cambiar `CobrosService` salvo el nombre del proveedor del webhook.
3. Ampliar Joi: `PAYMENT_PROVIDER` acepta `wompi` y exige las claves de Wompi (publica, privada, secreto de eventos, URL).
4. El webhook de Wompi no usa `stripe-signature`. Hoy [`webhook-pagos.controller.ts`](../apps/api/src/modulos/pagos/exposicion/webhook-pagos.controller.ts) lee esa cabecera; habrá que aceptar la cabecera de Wompi y pasar el proveedor real.
5. En [`cobros.service.ts`](../apps/api/src/modulos/pagos/aplicacion/cobros.service.ts), `procesarWebhook` llama `aplicarEventoProveedor('stripe', …)`. Ese literal debe salir del evento, no quedar fijo.
6. Probar un pago de sandbox y el rechazo antes de apagar el simulador en ese entorno.
