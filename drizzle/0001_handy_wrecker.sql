CREATE TYPE "public"."forecast_ledger_entry_type" AS ENUM('grant', 'entry', 'exit', 'flip-exit', 'flip-entry', 'settlement');--> statement-breakpoint
CREATE TABLE "forecast_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"prediction_event_id" uuid,
	"type" "forecast_ledger_entry_type" NOT NULL,
	"side" "prediction_outcome",
	"credits_delta" numeric(14, 6) DEFAULT 0 NOT NULL,
	"shares_delta" numeric(14, 6) DEFAULT 0 NOT NULL,
	"execution_price" numeric(14, 6),
	"realized_delta_credits" numeric(14, 6) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"prediction_event_id" uuid NOT NULL,
	"side" "prediction_outcome" NOT NULL,
	"shares" numeric(14, 6) DEFAULT 0 NOT NULL,
	"invested_credits" numeric(14, 6) DEFAULT 0 NOT NULL,
	"average_entry_price" numeric(14, 6) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "available_credits" numeric(14, 6) DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "realized_delta_credits" numeric(14, 6) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "forecast_ledger_entries" ADD CONSTRAINT "forecast_ledger_entries_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_ledger_entries" ADD CONSTRAINT "forecast_ledger_entries_prediction_event_id_prediction_events_id_fk" FOREIGN KEY ("prediction_event_id") REFERENCES "public"."prediction_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_positions" ADD CONSTRAINT "prediction_positions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_positions" ADD CONSTRAINT "prediction_positions_prediction_event_id_prediction_events_id_fk" FOREIGN KEY ("prediction_event_id") REFERENCES "public"."prediction_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forecast_ledger_entries_profile_idx" ON "forecast_ledger_entries" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "forecast_ledger_entries_market_idx" ON "forecast_ledger_entries" USING btree ("prediction_event_id");--> statement-breakpoint
CREATE INDEX "forecast_ledger_entries_created_idx" ON "forecast_ledger_entries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prediction_positions_profile_market_idx" ON "prediction_positions" USING btree ("profile_id","prediction_event_id");--> statement-breakpoint
CREATE INDEX "prediction_positions_market_idx" ON "prediction_positions" USING btree ("prediction_event_id");--> statement-breakpoint
CREATE INDEX "prediction_positions_profile_idx" ON "prediction_positions" USING btree ("profile_id");