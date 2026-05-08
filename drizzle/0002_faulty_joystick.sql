CREATE TYPE "public"."platform_activity_type" AS ENUM('user_joined', 'market_created', 'market_viewed', 'forecast_entry', 'forecast_exit', 'forecast_flip');--> statement-breakpoint
CREATE TABLE "platform_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_profile_id" uuid NOT NULL,
	"prediction_event_id" uuid,
	"type" "platform_activity_type" NOT NULL,
	"from_side" "prediction_outcome",
	"to_side" "prediction_outcome",
	"credits_amount" numeric(14, 6) DEFAULT 0 NOT NULL,
	"shares_amount" numeric(14, 6) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_activity_logs" ADD CONSTRAINT "platform_activity_logs_actor_profile_id_profiles_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_activity_logs" ADD CONSTRAINT "platform_activity_logs_prediction_event_id_prediction_events_id_fk" FOREIGN KEY ("prediction_event_id") REFERENCES "public"."prediction_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_activity_logs_actor_idx" ON "platform_activity_logs" USING btree ("actor_profile_id");--> statement-breakpoint
CREATE INDEX "platform_activity_logs_market_idx" ON "platform_activity_logs" USING btree ("prediction_event_id");--> statement-breakpoint
CREATE INDEX "platform_activity_logs_type_idx" ON "platform_activity_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "platform_activity_logs_created_idx" ON "platform_activity_logs" USING btree ("created_at");