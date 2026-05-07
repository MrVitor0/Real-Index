import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  integer,
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

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 40 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    reputationScore: integer("reputation_score").notNull().default(0),
    level: integer("level").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("profiles_username_idx").on(table.username)],
);

export const predictionEvents = pgTable(
  "prediction_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 48 }).notNull(),
    status: predictionStatusEnum("status").notNull().default("draft"),
    communityProbability: integer("community_probability")
      .notNull()
      .default(50),
    severityScore: integer("severity_score").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("prediction_events_slug_idx").on(table.slug)],
);

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type PredictionEvent = InferSelectModel<typeof predictionEvents>;
export type NewPredictionEvent = InferInsertModel<typeof predictionEvents>;
