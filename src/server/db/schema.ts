import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const predictionStatusEnum = pgEnum("prediction_status", [
  "draft",
  "active",
  "resolved",
  "cancelled",
]);

export const homeToneEnum = pgEnum("home_tone", [
  "primary",
  "sky",
  "mint",
  "gold",
  "coral",
  "slate",
]);

export const predictionOutcomeEnum = pgEnum("prediction_outcome", [
  "yes",
  "no",
]);

export const forecastLedgerEntryTypeEnum = pgEnum(
  "forecast_ledger_entry_type",
  ["grant", "entry", "exit", "flip-exit", "flip-entry", "settlement"],
);

export const platformActivityTypeEnum = pgEnum("platform_activity_type", [
  "user_joined",
  "market_created",
  "market_viewed",
  "forecast_entry",
  "forecast_exit",
  "forecast_flip",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: varchar("auth_user_id", { length: 191 }).notNull(),
    username: varchar("username", { length: 40 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    reputationScore: integer("reputation_score").notNull().default(0),
    level: integer("level").notNull().default(1),
    availableCredits: numeric("available_credits", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(5000),
    realizedDeltaCredits: numeric("realized_delta_credits", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_auth_user_id_idx").on(table.authUserId),
    uniqueIndex("profiles_username_idx").on(table.username),
  ],
);

export const predictionEvents = pgTable(
  "prediction_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdByProfileId: uuid("created_by_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 140 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    overview: text("overview").notNull(),
    category: varchar("category", { length: 48 }).notNull(),
    subCategory: varchar("sub_category", { length: 80 }).notNull(),
    iconLabel: varchar("icon_label", { length: 12 }).notNull(),
    tone: homeToneEnum("tone").notNull().default("primary"),
    yesLabel: varchar("yes_label", { length: 60 }).notNull(),
    noLabel: varchar("no_label", { length: 60 }).notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    rules: text("rules")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    contextNotes: text("context_notes")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    status: predictionStatusEnum("status").notNull().default("draft"),
    communityProbability: integer("community_probability")
      .notNull()
      .default(50),
    severityScore: integer("severity_score").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    watcherCount: integer("watcher_count").notNull().default(1),
    volumeCredits: integer("volume_credits").notNull().default(0),
    minimumCredits: integer("minimum_credits").notNull().default(50),
    initialCredits: integer("initial_credits").notNull().default(1000),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedOutcome: predictionOutcomeEnum("resolved_outcome"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("prediction_events_slug_idx").on(table.slug),
    index("prediction_events_creator_idx").on(table.createdByProfileId),
    index("prediction_events_status_idx").on(table.status),
  ],
);

export const predictionEventSnapshots = pgTable(
  "prediction_event_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    predictionEventId: uuid("prediction_event_id")
      .notNull()
      .references(() => predictionEvents.id, { onDelete: "cascade" }),
    probability: integer("probability").notNull(),
    watcherCount: integer("watcher_count").notNull().default(1),
    volumeCredits: integer("volume_credits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("prediction_event_snapshots_event_created_idx").on(
      table.predictionEventId,
      table.createdAt,
    ),
  ],
);

export const predictionPositions = pgTable(
  "prediction_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    predictionEventId: uuid("prediction_event_id")
      .notNull()
      .references(() => predictionEvents.id, { onDelete: "cascade" }),
    side: predictionOutcomeEnum("side").notNull(),
    shares: numeric("shares", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    investedCredits: numeric("invested_credits", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    averageEntryPrice: numeric("average_entry_price", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("prediction_positions_profile_market_idx").on(
      table.profileId,
      table.predictionEventId,
    ),
    index("prediction_positions_market_idx").on(table.predictionEventId),
    index("prediction_positions_profile_idx").on(table.profileId),
  ],
);

export const forecastLedgerEntries = pgTable(
  "forecast_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    predictionEventId: uuid("prediction_event_id").references(
      () => predictionEvents.id,
      { onDelete: "cascade" },
    ),
    type: forecastLedgerEntryTypeEnum("type").notNull(),
    side: predictionOutcomeEnum("side"),
    creditsDelta: numeric("credits_delta", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    sharesDelta: numeric("shares_delta", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    executionPrice: numeric("execution_price", {
      precision: 14,
      scale: 6,
      mode: "number",
    }),
    realizedDeltaCredits: numeric("realized_delta_credits", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("forecast_ledger_entries_profile_idx").on(table.profileId),
    index("forecast_ledger_entries_market_idx").on(table.predictionEventId),
    index("forecast_ledger_entries_created_idx").on(table.createdAt),
  ],
);

export const platformActivityLogs = pgTable(
  "platform_activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorProfileId: uuid("actor_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    predictionEventId: uuid("prediction_event_id").references(
      () => predictionEvents.id,
      { onDelete: "cascade" },
    ),
    type: platformActivityTypeEnum("type").notNull(),
    fromSide: predictionOutcomeEnum("from_side"),
    toSide: predictionOutcomeEnum("to_side"),
    creditsAmount: numeric("credits_amount", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    sharesAmount: numeric("shares_amount", {
      precision: 14,
      scale: 6,
      mode: "number",
    })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("platform_activity_logs_actor_idx").on(table.actorProfileId),
    index("platform_activity_logs_market_idx").on(table.predictionEventId),
    index("platform_activity_logs_type_idx").on(table.type),
    index("platform_activity_logs_created_idx").on(table.createdAt),
  ],
);

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type PredictionEvent = InferSelectModel<typeof predictionEvents>;
export type NewPredictionEvent = InferInsertModel<typeof predictionEvents>;
export type PredictionEventSnapshot = InferSelectModel<
  typeof predictionEventSnapshots
>;
export type NewPredictionEventSnapshot = InferInsertModel<
  typeof predictionEventSnapshots
>;
export type PredictionPosition = InferSelectModel<typeof predictionPositions>;
export type NewPredictionPosition = InferInsertModel<
  typeof predictionPositions
>;
export type ForecastLedgerEntryRow = InferSelectModel<
  typeof forecastLedgerEntries
>;
export type NewForecastLedgerEntryRow = InferInsertModel<
  typeof forecastLedgerEntries
>;
export type PlatformActivityType =
  (typeof platformActivityTypeEnum.enumValues)[number];
export type PlatformActivityLog = InferSelectModel<typeof platformActivityLogs>;
export type NewPlatformActivityLog = InferInsertModel<
  typeof platformActivityLogs
>;
