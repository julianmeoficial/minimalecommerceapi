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

1. Rota la contraseña en el proveedor (en Supabase: **Project Settings → Database → Reset database password**).
2. Actualiza `DATABASE_URL` en la raíz **y** en `apps/api/.env` (Prisma no lee el `.env` de la raíz).
3. Reinicia la API.
4. Comprueba `GET /api/salud/listo` (Postgres + Redis). `/api/salud/vida` solo dice que el proceso responde.

`REDIS_URL` se rota igual: nuevo secreto en el proveedor, actualizar la variable, reiniciar.

## Supabase (`service_role` y Storage)

Al cambiar de proyecto o de cuenta (hoy **Monica_BK** / `MinimalShop_API`, ref `rbgidchvwvadwxuidsxj`):

1. Copia la nueva Project URL a `SUPABASE_URL` y el secreto **service_role** a `SUPABASE_SERVICE_ROLE_KEY`. No uses la clave anon.
2. Si las imágenes van a Storage (`MEDIA_DRIVER=supabase`), crea el bucket (`SUPABASE_STORAGE_BUCKET`, por defecto `product-images`). Los objetos del proyecto anterior no se mueven solos.
3. Revoca el `service_role` y la contraseña de Database del proyecto que dejas de usar.
4. Los JWT de la API (`JWT_SECRET` / `JWT_KEYS`) no dependen de Supabase: siguen válidos hasta que los rotes aparte.
