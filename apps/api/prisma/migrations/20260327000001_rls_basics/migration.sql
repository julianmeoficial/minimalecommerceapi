-- Enable RLS as a second barrier on sensitive tables (API still uses service role / direct connection).
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Permissive policies for the application role (service connection bypasses via table owner / SUPERUSER in local).
CREATE POLICY app_users_all ON "users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY app_addresses_all ON "addresses" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY app_orders_all ON "orders" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY app_payments_all ON "payments" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY app_notifications_all ON "notifications" FOR ALL USING (true) WITH CHECK (true);
