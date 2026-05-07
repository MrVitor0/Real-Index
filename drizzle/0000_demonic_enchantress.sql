CREATE TYPE "public"."home_tone" AS ENUM('primary', 'sky', 'mint', 'gold', 'coral', 'slate');--> statement-breakpoint
CREATE TYPE "public"."prediction_outcome" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."prediction_status" AS ENUM('draft', 'active', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TABLE "prediction_event_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_event_id" uuid NOT NULL,
	"probability" integer NOT NULL,
	"watcher_count" integer DEFAULT 1 NOT NULL,
	"volume_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"slug" varchar(140) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"overview" text NOT NULL,
	"category" varchar(48) NOT NULL,
	"sub_category" varchar(80) NOT NULL,
	"icon_label" varchar(12) NOT NULL,
	"tone" "home_tone" DEFAULT 'primary' NOT NULL,
	"yes_label" varchar(60) NOT NULL,
	"no_label" varchar(60) NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"rules" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"context_notes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"status" "prediction_status" DEFAULT 'draft' NOT NULL,
	"community_probability" integer DEFAULT 50 NOT NULL,
	"severity_score" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"watcher_count" integer DEFAULT 1 NOT NULL,
	"volume_credits" integer DEFAULT 0 NOT NULL,
	"minimum_credits" integer DEFAULT 50 NOT NULL,
	"initial_credits" integer DEFAULT 1000 NOT NULL,
	"expires_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolved_outcome" "prediction_outcome",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" varchar(191) NOT NULL,
	"username" varchar(40) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"bio" text,
	"avatar_url" text,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prediction_event_snapshots" ADD CONSTRAINT "prediction_event_snapshots_prediction_event_id_prediction_events_id_fk" FOREIGN KEY ("prediction_event_id") REFERENCES "public"."prediction_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_events" ADD CONSTRAINT "prediction_events_created_by_profile_id_profiles_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prediction_event_snapshots_event_created_idx" ON "prediction_event_snapshots" USING btree ("prediction_event_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prediction_events_slug_idx" ON "prediction_events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "prediction_events_creator_idx" ON "prediction_events" USING btree ("created_by_profile_id");--> statement-breakpoint
CREATE INDEX "prediction_events_status_idx" ON "prediction_events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_auth_user_id_idx" ON "profiles" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_idx" ON "profiles" USING btree ("username");