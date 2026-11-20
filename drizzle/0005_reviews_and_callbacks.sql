CREATE TABLE "callback_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"phone" text,
	"customer_name" text,
	"governorate" text,
	"city" text,
	"address" text,
	"items" jsonb,
	"angle" text,
	"closed_at" timestamp with time zone,
	"order_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"photo_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "callback_drafts" ADD CONSTRAINT "callback_drafts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "callback_drafts_open_idx" ON "callback_drafts" USING btree ("closed_at","updated_at");