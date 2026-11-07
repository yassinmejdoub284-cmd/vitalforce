ALTER TABLE "orders" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_archived_idx" ON "orders" USING btree ("archived_at");