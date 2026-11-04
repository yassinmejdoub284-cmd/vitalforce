CREATE TABLE "ad_spend" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"platform" text DEFAULT 'meta' NOT NULL,
	"campaign" text DEFAULT 'Total' NOT NULL,
	"amount" numeric(12, 3) NOT NULL,
	"impressions" integer,
	"clicks" integer,
	"landing_page_views" integer,
	"pixel_purchases" integer,
	"pixel_checkouts" integer,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT 'Admin' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "blacklist" (
	"phone" text PRIMARY KEY NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"type" text NOT NULL,
	"path" text,
	"angle" text,
	"source" text,
	"value" numeric(12, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"email" text,
	"success" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"unit_price" numeric(12, 3) NOT NULL,
	"unit_cost" numeric(12, 3) DEFAULT 0 NOT NULL,
	"packaging_cost" numeric(12, 3) DEFAULT 0 NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"phone2" text,
	"email" text,
	"governorate" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"call_attempts" integer DEFAULT 0 NOT NULL,
	"cancel_reason" text,
	"internal_note" text,
	"subtotal" numeric(12, 3) NOT NULL,
	"delivery_fee" numeric(12, 3) DEFAULT 0 NOT NULL,
	"discount" numeric(12, 3) DEFAULT 0 NOT NULL,
	"total" numeric(12, 3) NOT NULL,
	"carrier_cost" numeric(12, 3) DEFAULT 0 NOT NULL,
	"return_cost" numeric(12, 3) DEFAULT 0 NOT NULL,
	"confirmation_cost" numeric(12, 3) DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'site' NOT NULL,
	"landing_angle" text,
	"utm" jsonb,
	"visitor_id" text,
	"fbp" text,
	"fbc" text,
	"ip" text,
	"user_agent" text,
	"carrier" text,
	"carrier_barcode" text,
	"carrier_state" text,
	"carrier_pre_state" text,
	"carrier_reason" text,
	"carrier_pre_reason" text,
	"carrier_paid" boolean DEFAULT false NOT NULL,
	"carrier_paid_at" timestamp with time zone,
	"carrier_synced_at" timestamp with time zone,
	"carrier_error" text,
	"stock_reserved" boolean DEFAULT false NOT NULL,
	"meta_purchase_sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"subtitle" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sku" text NOT NULL,
	"flavor" text DEFAULT '' NOT NULL,
	"net_weight" text DEFAULT '' NOT NULL,
	"price" numeric(12, 3) NOT NULL,
	"compare_at_price" numeric(12, 3),
	"cost_price" numeric(12, 3) DEFAULT 0 NOT NULL,
	"packaging_cost" numeric(12, 3) DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 20 NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"template" text DEFAULT 'simple' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"admin_id" integer,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" text PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"current_path" text,
	"landing_path" text,
	"referrer" text,
	"source" text,
	"utm" jsonb,
	"device" text,
	"country" text,
	"city" text,
	"page_views" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ad_spend_day_campaign_idx" ON "ad_spend" USING btree ("date","platform","campaign");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_type_created_idx" ON "events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_barcode_idx" ON "orders" USING btree ("carrier_barcode");--> statement-breakpoint
CREATE INDEX "visitors_last_seen_idx" ON "visitors" USING btree ("last_seen");