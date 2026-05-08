import { homeLiveResponseSchema } from "@/features/home/contracts/home-live";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import { getCommunityMetrics } from "@/server/home/community-metrics";
import { getParticipantRanking } from "@/server/home/participant-ranking";
import { getMarketplaceCatalog } from "@/server/marketplace/catalog";
import { getRecentActivityFeed } from "@/server/activity/log";
import { getHomeFeedData } from "@/server/markets/catalog";
import { getViewerForecastBalance } from "@/server/markets/trading";

const STREAM_RETRY_MS = 5_000;
const SNAPSHOT_INTERVAL_MS = 10_000;

export const dynamic = "force-dynamic";

async function buildHomeLiveResponse(
  context: Awaited<ReturnType<typeof createRouteContext>>,
) {
  const [
    homeFeed,
    ranking,
    recentActivity,
    communityMetrics,
    navbarBalance,
    marketplaceCatalog,
  ] = await Promise.all([
    getHomeFeedData(),
    getParticipantRanking({ limit: 3 }),
    getRecentActivityFeed({ limit: 3 }),
    getCommunityMetrics(),
    getViewerForecastBalance(context.viewer),
    getMarketplaceCatalog(null),
  ]);

  return homeLiveResponseSchema.parse({
    meta: {
      requestId: context.requestId,
      generatedAt: new Date().toISOString(),
      auth: context.auth,
    },
    data: {
      homeFeed,
      ranking,
      recentActivity,
      communityMetrics,
      navbarBalance,
      marketplaceRewards: marketplaceCatalog.rewards,
    },
  });
}

function serializeStreamEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    presetName: "stream",
    resource: "home-live",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;
      let nextSnapshotTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let lastPayload = "";

      const closeStream = () => {
        if (isClosed) {
          return;
        }

        isClosed = true;

        if (nextSnapshotTimeoutId !== null) {
          clearTimeout(nextSnapshotTimeoutId);
          nextSnapshotTimeoutId = null;
        }

        controller.close();
      };

      const scheduleNextSnapshot = () => {
        if (isClosed) {
          return;
        }

        nextSnapshotTimeoutId = setTimeout(() => {
          void publishSnapshots();
        }, SNAPSHOT_INTERVAL_MS);
      };

      const publishSnapshots = async () => {
        try {
          const payload = await buildHomeLiveResponse(context);
          const serializedPayload = JSON.stringify(payload);

          if (!isClosed && serializedPayload !== lastPayload) {
            controller.enqueue(
              encoder.encode(serializeStreamEvent("snapshot", payload)),
            );
            lastPayload = serializedPayload;
          }
        } catch (error) {
          if (!isClosed) {
            controller.enqueue(
              encoder.encode(
                serializeStreamEvent("failure", {
                  error:
                    error instanceof Error
                      ? error.message
                      : "Nao foi possivel atualizar o painel live da home.",
                }),
              ),
            );
          }
        }

        scheduleNextSnapshot();
      };

      controller.enqueue(encoder.encode(`retry: ${STREAM_RETRY_MS}\n\n`));

      request.signal.addEventListener("abort", closeStream, { once: true });
      void publishSnapshots();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
      "x-request-id": context.requestId,
    },
  });
}
