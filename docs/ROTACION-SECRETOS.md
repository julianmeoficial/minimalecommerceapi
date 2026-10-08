# Rotación de secretos (JWT y pagos)

## JWT con `kid` (`JWT_KEYS`)

1. Genera un secreto nuevo de al menos 32 caracteres.
2. Añade una entrada `nuevo:secreto` al inicio de `JWT_KEYS` (la primera clave firma los access tokens).
3. Despliega la API; los tokens emitidos antes siguen validándose con las claves anteriores.
4. Tras el TTL de refresh (`JWT_REFRESH_TTL_DIAS`), elimina claves antiguas de la lista.

Sin `JWT_KEYS`, se usa `JWT_SECRET` con `kid` implícito `default`.

## Stripe

1. Crea la nueva clave en el dashboard de Stripe.
2. Actualiza `STRIPE_SECRET_KEY` y registra el nuevo endpoint de webhook con `STRIPE_WEBHOOK_SECRET`.
3. Despliega y verifica un pago de prueba antes de revocar la clave anterior.

## Base de datos y Redis

Rotar credenciales en el proveedor, actualizar `DATABASE_URL` / `REDIS_URL` y reiniciar las instancias de la API.
