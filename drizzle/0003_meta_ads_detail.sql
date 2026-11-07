CREATE TABLE "meta_ad_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"campaign_id" text DEFAULT '' NOT NULL,
	"campaign_name" text DEFAULT '' NOT NULL,
	"adset_id" text DEFAULT '' NOT NULL,
	"adset_name" text DEFAULT '' NOT NULL,
	"ad_id" text NOT NULL,
	"ad_name" text DEFAULT '' NOT NULL,
	"spend" numeric(12, 3) DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"link_clicks" integer DEFAULT 0 NOT NULL,
	"landing_page_views" integer DEFAULT 0 NOT NULL,
	"view_content" integer DEFAULT 0 NOT NULL,
	"add_to_cart" integer DEFAULT 0 NOT NULL,
	"initiate_checkout" integer DEFAULT 0 NOT NULL,
	"purchases" integer DEFAULT 0 NOT NULL,
	"purchase_value" numeric(12, 3) DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"video_plays_3s" integer DEFAULT 0 NOT NULL,
	"video_p25" integer DEFAULT 0 NOT NULL,
	"video_p50" integer DEFAULT 0 NOT NULL,
	"video_p75" integer DEFAULT 0 NOT NULL,
	"video_p100" integer DEFAULT 0 NOT NULL,
	"thruplays" integer DEFAULT 0 NOT NULL,
	"post_engagement" integer DEFAULT 0 NOT NULL,
	"reactions" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"page_likes" integer DEFAULT 0 NOT NULL,
	"messages" integer DEFAULT 0 NOT NULL,
	"objective" text,
	"optimization_goal" text,
	"actions" jsonb,
	"action_values" jsonb
);
--> statement-breakpoint
CREATE TABLE "meta_ads" (
	"ad_id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"status" text,
	"effective_status" text,
	"campaign_id" text,
	"adset_id" text,
	"created_time" timestamp with time zone,
	"title" text,
	"body" text,
	"call_to_action" text,
	"object_type" text,
	"thumbnail_url" text,
	"link" text,
	"period_since" date,
	"period_until" date,
	"period_reach" integer,
	"period_frequency" double precision,
	"quality_ranking" text,
	"engagement_ranking" text,
	"conversion_ranking" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "meta_ad_insights_day_ad_idx" ON "meta_ad_insights" USING btree ("date","ad_id");--> statement-breakpoint
CREATE INDEX "meta_ad_insights_date_idx" ON "meta_ad_insights" USING btree ("date");