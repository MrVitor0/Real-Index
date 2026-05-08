CREATE TYPE "public"."marketplace_redemption_status" AS ENUM('pending', 'fulfilled', 'cancelled');--> statement-breakpoint
CREATE TABLE "marketplace_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"reward_title_snapshot" varchar(140) NOT NULL,
	"credits_spent" integer NOT NULL,
	"status" "marketplace_redemption_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(140) NOT NULL,
	"title" varchar(140) NOT NULL,
	"subtitle" text NOT NULL,
	"background_image_url" text NOT NULL,
	"credit_cost" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_redemptions" ADD CONSTRAINT "marketplace_redemptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_redemptions" ADD CONSTRAINT "marketplace_redemptions_reward_id_marketplace_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."marketplace_rewards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketplace_redemptions_profile_idx" ON "marketplace_redemptions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "marketplace_redemptions_reward_idx" ON "marketplace_redemptions" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "marketplace_redemptions_status_idx" ON "marketplace_redemptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketplace_redemptions_created_idx" ON "marketplace_redemptions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_rewards_slug_idx" ON "marketplace_rewards" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "marketplace_rewards_active_sort_idx" ON "marketplace_rewards" USING btree ("is_active","sort_order");