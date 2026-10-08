-- Fase 5: ciclo de vida del pedido (TCC 8.4), reservas con vigencia (RI-10),
-- webhook idempotente (RI-04), conciliación (RI-09), refresh tokens (RI-03),
-- claves de imagen en Storage (H-03), índices de catálogo (EAC-01) y RLS sin políticas permisivas.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVA', 'CONFIRMADA', 'LIBERADA');

-- AlterEnum: PENDIENTE pasa a PENDIENTE_PAGO y CONFIRMADO a EN_PREPARACION
CREATE TYPE "OrderStatus_new" AS ENUM ('CREADO', 'PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'REEMBOLSADO');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'PENDIENTE' THEN 'PENDIENTE_PAGO'
    WHEN 'CONFIRMADO' THEN 'EN_PREPARACION'
    ELSE "status"::text
  END
)::"OrderStatus_new";
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'CREADO';

-- DropIndex (reemplazados por índices compuestos)
DROP INDEX "notifications_user_id_idx";
DROP INDEX "orders_buyer_id_idx";
DROP INDEX "products_active_idx";
DROP INDEX "products_category_id_idx";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "cancel_reason" TEXT,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "payments" ADD COLUMN "last_reconciled_at" TIMESTAMP(3);

-- La columna guarda ahora la clave del objeto, no una URL pública
ALTER TABLE "products" RENAME COLUMN "image_url" TO "image_key";
UPDATE "products" SET "image_key" = regexp_replace("image_key", '^.*/', '') WHERE "image_key" IS NOT NULL;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_reservations" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVA',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");
CREATE INDEX "stock_reservations_order_id_idx" ON "stock_reservations"("order_id");
CREATE INDEX "stock_reservations_status_expires_at_idx" ON "stock_reservations"("status", "expires_at");
CREATE UNIQUE INDEX "payment_events_provider_event_id_key" ON "payment_events"("provider_event_id");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");
CREATE INDEX "orders_buyer_id_placed_at_idx" ON "orders"("buyer_id", "placed_at");
CREATE UNIQUE INDEX "payments_external_id_key" ON "payments"("external_id");
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");
CREATE INDEX "products_active_category_id_price_idx" ON "products"("active", "category_id", "price");
CREATE INDEX "products_active_created_at_idx" ON "products"("active", "created_at");
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "reviews_product_id_created_at_idx" ON "reviews"("product_id", "created_at");
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Registro de módulos: claves en español
DELETE FROM "feature_flags" WHERE "key" IN ('reviews', 'favorites', 'blog', 'events');
INSERT INTO "feature_flags" ("id", "key", "enabled", "updated_at") VALUES
  (gen_random_uuid(), 'cupones', true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'resenas', true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'favoritos', true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'contenido', true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'notificaciones', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- RLS como segunda barrera (EAC-03). Las políticas USING (true) anteriores no
-- tenían rol destino y en Supabase abrían las tablas a anon/authenticated vía PostgREST.
-- Sin políticas, solo el propietario de las tablas (la conexión de la API) puede leer o escribir.
DROP POLICY IF EXISTS app_users_all ON "users";
DROP POLICY IF EXISTS app_addresses_all ON "addresses";
DROP POLICY IF EXISTS app_orders_all ON "orders";
DROP POLICY IF EXISTS app_payments_all ON "payments";
DROP POLICY IF EXISTS app_notifications_all ON "notifications";

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'addresses', 'categories', 'products', 'cart_items', 'coupons', 'orders',
    'order_items', 'stock_reservations', 'payments', 'payment_events', 'refresh_tokens',
    'notifications', 'reviews', 'favorites', 'blog_posts', 'events', 'seller_metrics', 'feature_flags'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
  END IF;
END $$;
