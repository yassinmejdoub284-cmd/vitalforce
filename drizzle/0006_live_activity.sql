CREATE TABLE "visitor_activity" (
	"visitor_id" text PRIMARY KEY NOT NULL,
	"snapshot" jsonb NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "visitor_activity_seen_idx" ON "visitor_activity" USING btree ("seen_at");