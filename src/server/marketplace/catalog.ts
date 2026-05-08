import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  buildMarketplaceCatalog,
  buildMarketplaceRedemption,
  getMarketplaceRedemptionLimitMessage,
  maxMarketplaceRewardRedemptionsPerAccount,
  previewMarketplaceRedemption,
} from "@/features/marketplace/lib/marketplace";
import {
  marketplaceCatalogSchema,
  marketplaceRedeemResponseSchema,
  marketplaceRedemptionResultSchema,
  marketplaceRedemptionStatusSchema,
  type MarketplaceCatalog,
  type MarketplaceRedeemResponse,
  type MarketplaceRedemptionResult,
} from "@/features/marketplace/contracts/marketplace";
import { formatCredits } from "@/features/market-detail/lib/forecast";
import { getDb } from "@/server/db/client";
import {
  marketplaceRedemptions,
  marketplaceRewards,
  profiles,
  type MarketplaceRedemption as MarketplaceRedemptionRow,
  type MarketplaceReward as MarketplaceRewardRow,
  type MarketplaceRedemptionStatus,
} from "@/server/db/schema";
import { syncViewerProfile } from "@/server/markets/catalog";
import { createMarketplaceRedemptionResult } from "@/server/marketplace/reward-effects";

type ViewerIdentity = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

type RedemptionMutationRow = {
  redemptionId: string;
  availableCredits: number;
  creditsSpent: number;
  rewardTitle: string;
  status: MarketplaceRedemptionStatus;
  createdAt: Date;
  resultPayload: MarketplaceRedemptionResult | null;
};

const globalForMarketplaceCatalog = globalThis as typeof globalThis & {
  __realSeverityMarketplaceStorageWarningShown?: boolean;
};

const redemptionMutationRowSchema = z.object({
  redemptionId: z.string().min(1),
  availableCredits: z.coerce.number(),
  creditsSpent: z.coerce.number(),
  rewardTitle: z.string().min(1),
  status: marketplaceRedemptionStatusSchema,
  createdAt: z.coerce.date(),
  resultPayload: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value ?? null;
    }

    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }, marketplaceRedemptionResultSchema.nullable()),
});

function isMissingMarketplaceStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorWithCode = error as Error & {
    code?: string;
    cause?: {
      code?: string;
    };
  };
  const errorCode = errorWithCode.code ?? errorWithCode.cause?.code;

  if (errorCode === "42P01" || errorCode === "42704") {
    return true;
  }

  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedMessage.includes("marketplace_rewards") ||
    normalizedMessage.includes("marketplace_redemptions") ||
    normalizedMessage.includes("marketplace_redemption_status")
  );
}

function warnMissingMarketplaceStorageOnce() {
  if (
    globalForMarketplaceCatalog.__realSeverityMarketplaceStorageWarningShown
  ) {
    return;
  }

  globalForMarketplaceCatalog.__realSeverityMarketplaceStorageWarningShown = true;
  console.warn(
    "Marketplace storage is unavailable. Apply pending marketplace migrations before enabling marketplace queries.",
  );
}

function buildMarketplaceStorageUnavailableCatalog(input: {
  authStatus: "anonymous" | "authenticated";
  availableCredits: number;
}): MarketplaceCatalog {
  const catalog = buildMarketplaceCatalog({
    balance: {
      authStatus: input.authStatus,
      availableCredits: input.availableCredits,
    },
    rewards: [],
    redemptions: [],
  });

  return marketplaceCatalogSchema.parse({
    ...catalog,
    helperTitle: "Marketplace em configuracao",
    helperDescription:
      "O schema do marketplace ainda nao foi aplicado no banco atual. Rode as migrations pendentes antes de publicar ou consumir os perks.",
  });
}

export async function getMarketplaceCatalog(
  viewer: ViewerIdentity | null,
): Promise<MarketplaceCatalog> {
  const profile = viewer ? await syncViewerProfile(viewer) : null;
  const db = getDb();
  let rewardRows: MarketplaceRewardRow[];
  let redemptionRows: MarketplaceRedemptionRow[];

  try {
    [rewardRows, redemptionRows] = await Promise.all([
      db
        .select()
        .from(marketplaceRewards)
        .orderBy(asc(marketplaceRewards.sortOrder)),
      profile
        ? db
            .select()
            .from(marketplaceRedemptions)
            .where(eq(marketplaceRedemptions.profileId, profile.id))
            .orderBy(desc(marketplaceRedemptions.createdAt))
        : Promise.resolve([] as MarketplaceRedemptionRow[]),
    ]);
  } catch (error) {
    if (isMissingMarketplaceStorageError(error)) {
      warnMissingMarketplaceStorageOnce();

      return buildMarketplaceStorageUnavailableCatalog({
        authStatus: profile ? "authenticated" : "anonymous",
        availableCredits: profile?.availableCredits ?? 0,
      });
    }

    throw error;
  }

  return marketplaceCatalogSchema.parse(
    buildMarketplaceCatalog({
      balance: {
        authStatus: profile ? "authenticated" : "anonymous",
        availableCredits: profile?.availableCredits ?? 0,
      },
      rewards: rewardRows.map((reward) => ({
        id: reward.id,
        slug: reward.slug,
        title: reward.title,
        subtitle: reward.subtitle,
        backgroundImageUrl: reward.backgroundImageUrl,
        creditCost: reward.creditCost,
        isActive: reward.isActive,
        sortOrder: reward.sortOrder,
        createdAt: reward.createdAt,
      })),
      redemptions: redemptionRows.map((redemption) => ({
        id: redemption.id,
        rewardId: redemption.rewardId,
        rewardTitle: redemption.rewardTitleSnapshot,
        creditsSpent: redemption.creditsSpent,
        status: redemption.status,
        createdAt: redemption.createdAt,
        result: redemption.resultPayload,
      })),
    }),
  );
}

async function getActiveRewardById(rewardId: string) {
  const db = getDb();
  try {
    const [reward] = await db
      .select()
      .from(marketplaceRewards)
      .where(
        and(
          eq(marketplaceRewards.id, rewardId),
          eq(marketplaceRewards.isActive, true),
        ),
      )
      .limit(1);

    return reward ?? null;
  } catch (error) {
    if (isMissingMarketplaceStorageError(error)) {
      warnMissingMarketplaceStorageOnce();
      throw new Error(
        "Marketplace indisponivel neste banco. Aplique as migrations pendentes.",
      );
    }

    throw error;
  }
}

async function readCurrentAvailableCredits(profileId: string) {
  const db = getDb();
  const [profile] = await db
    .select({ availableCredits: profiles.availableCredits })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  return profile?.availableCredits ?? 0;
}

async function countMarketplaceRedemptions(input: {
  profileId: string;
  rewardId: string;
}) {
  const db = getDb();

  try {
    const [summary] = await db
      .select({ redemptionCount: sql<number>`count(*)::integer` })
      .from(marketplaceRedemptions)
      .where(
        and(
          eq(marketplaceRedemptions.profileId, input.profileId),
          eq(marketplaceRedemptions.rewardId, input.rewardId),
        ),
      );

    return Number(summary?.redemptionCount ?? 0);
  } catch (error) {
    if (isMissingMarketplaceStorageError(error)) {
      warnMissingMarketplaceStorageOnce();
      throw new Error(
        "Marketplace indisponivel neste banco. Aplique as migrations pendentes.",
      );
    }

    throw error;
  }
}

async function persistMarketplaceRedemption(input: {
  profileId: string;
  rewardId: string;
  rewardTitle: string;
  creditsSpent: number;
  resultPayload: MarketplaceRedemptionResult | null;
}) {
  const db = getDb();
  const persistenceTimestamp = new Date();
  const resultPayloadJson = input.resultPayload
    ? JSON.stringify(input.resultPayload)
    : null;

  try {
    const result = await db.execute(sql<RedemptionMutationRow>`
      WITH redemption_guard AS (
        SELECT pg_advisory_xact_lock(
          hashtext(${input.profileId}),
          hashtext(${input.rewardId})
        ) AS guard_acquired
      ),
      redemption_state AS (
        SELECT COUNT(*)::integer AS redemption_count
        FROM marketplace_redemptions, redemption_guard
        WHERE profile_id = ${input.profileId}
          AND reward_id = ${input.rewardId}
      ),
      updated_profile AS (
        UPDATE profiles
        SET
          available_credits = available_credits - ${input.creditsSpent},
          updated_at = ${persistenceTimestamp}
        WHERE id = ${input.profileId}
          AND available_credits >= ${input.creditsSpent}
          AND (
            SELECT redemption_count
            FROM redemption_state
          ) < ${maxMarketplaceRewardRedemptionsPerAccount}
        RETURNING available_credits
      ),
      inserted_redemption AS (
        INSERT INTO marketplace_redemptions (
          profile_id,
          reward_id,
          reward_title_snapshot,
          credits_spent,
          result_payload,
          status,
          created_at,
          updated_at
        )
        SELECT
          ${input.profileId},
          ${input.rewardId},
          ${input.rewardTitle},
          ${input.creditsSpent},
          ${resultPayloadJson}::jsonb,
          'pending',
          ${persistenceTimestamp},
          ${persistenceTimestamp}
        FROM updated_profile
        RETURNING
          id AS "redemptionId",
          credits_spent AS "creditsSpent",
          result_payload AS "resultPayload",
          status AS "status",
          created_at AS "createdAt"
      )
      SELECT
        inserted_redemption."redemptionId",
        updated_profile.available_credits AS "availableCredits",
        inserted_redemption."creditsSpent",
        ${input.rewardTitle} AS "rewardTitle",
        inserted_redemption."status",
        inserted_redemption."createdAt",
        inserted_redemption."resultPayload"
      FROM inserted_redemption
      INNER JOIN updated_profile ON true
    `);

    const row = result.rows[0];

    return row ? redemptionMutationRowSchema.parse(row) : null;
  } catch (error) {
    if (isMissingMarketplaceStorageError(error)) {
      warnMissingMarketplaceStorageOnce();
      throw new Error(
        "Marketplace indisponivel neste banco. Aplique as migrations pendentes.",
      );
    }

    throw error;
  }
}

export async function redeemMarketplaceReward(input: {
  viewer: ViewerIdentity;
  rewardId: string;
}): Promise<MarketplaceRedeemResponse> {
  const profile = await syncViewerProfile(input.viewer);
  const reward = await getActiveRewardById(input.rewardId);

  if (!reward) {
    throw new Error("Item do marketplace nao encontrado.");
  }

  const redemptionCount = await countMarketplaceRedemptions({
    profileId: profile.id,
    rewardId: reward.id,
  });

  previewMarketplaceRedemption({
    availableCredits: profile.availableCredits,
    reward: {
      title: reward.title,
      creditCost: reward.creditCost,
    },
    redemptionCount,
  });

  const mutation = await persistMarketplaceRedemption({
    profileId: profile.id,
    rewardId: reward.id,
    rewardTitle: reward.title,
    creditsSpent: reward.creditCost,
    resultPayload: createMarketplaceRedemptionResult(reward),
  });

  if (!mutation) {
    const currentAvailableCredits = await readCurrentAvailableCredits(
      profile.id,
    );

    if (currentAvailableCredits < reward.creditCost) {
      throw new Error(`Saldo insuficiente para resgatar ${reward.title}.`);
    }

    const currentRedemptionCount = await countMarketplaceRedemptions({
      profileId: profile.id,
      rewardId: reward.id,
    });

    if (currentRedemptionCount >= maxMarketplaceRewardRedemptionsPerAccount) {
      throw new Error(
        getMarketplaceRedemptionLimitMessage(
          maxMarketplaceRewardRedemptionsPerAccount,
        ),
      );
    }

    throw new Error("Nao foi possivel registrar esse resgate agora.");
  }

  const redemption = buildMarketplaceRedemption({
    id: mutation.redemptionId,
    rewardId: reward.id,
    rewardTitle: mutation.rewardTitle,
    creditsSpent: mutation.creditsSpent,
    status: mutation.status,
    createdAt: mutation.createdAt,
    result: mutation.resultPayload,
  });

  return marketplaceRedeemResponseSchema.parse({
    balance: {
      authStatus: "authenticated",
      availableCredits: mutation.availableCredits,
      availableCreditsLabel: formatCredits(mutation.availableCredits),
    },
    redemption,
    message: `${reward.title} entrou na fila do marketplace.`,
  });
}
