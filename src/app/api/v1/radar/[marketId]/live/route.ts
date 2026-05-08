import { NextResponse } from "next/server";

import { radarLiveResponseSchema } from "@/features/market-detail/contracts/radar-live";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import { getRadarMarketDetailBySlug } from "@/server/markets/catalog";
import { getViewerForecastMarketState } from "@/server/markets/trading";

const STREAM_RETRY_MS = 5_000;
const SNAPSHOT_INTERVAL_MS = 5_000;

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{
    marketId: string;
  }>;
};

async function buildRadarLiveResponse(input: {
  marketId: string;
  context: Awaited<ReturnType<typeof createRouteContext>>;
}) {
  const { context, marketId } = input;
  const [market, accountState] = await Promise.all([
    getRadarMarketDetailBySlug(marketId),
    getViewerForecastMarketState(context.viewer, marketId),
  ]);

  if (!market) {
    throw new Error("Mercado nao encontrado.");
  }

  return radarLiveResponseSchema.parse({
    meta: {
      requestId: context.requestId,
      generatedAt: new Date().toISOString(),
      auth: context.auth,
    },
    data: {
      market,
      accountState,
    },
  });
}

function serializeStreamEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request, { params }: RouteProps) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    presetName: "stream",
    resource: "radar-live",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { marketId } = await params;

  try {
    const initialPayload = await buildRadarLiveResponse({
      marketId,
      context,
    });
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let isClosed = false;
        let nextSnapshotTimeoutId: ReturnType<typeof setTimeout> | null = null;
        let lastPayload = JSON.stringify(initialPayload);

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
            const payload = await buildRadarLiveResponse({
              marketId,
              context,
            });
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
                        : "Nao foi possivel atualizar o radar em tempo real.",
                  }),
                ),
              );
            }
          }

          scheduleNextSnapshot();
        };

        controller.enqueue(encoder.encode(`retry: ${STREAM_RETRY_MS}\n\n`));
        controller.enqueue(
          encoder.encode(serializeStreamEvent("snapshot", initialPayload)),
        );

        request.signal.addEventListener("abort", closeStream, { once: true });
        scheduleNextSnapshot();
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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel carregar o radar live.";
    const status = message === "Mercado nao encontrado." ? 404 : 400;

    return NextResponse.json(
      {
        error: message,
        requestId: context.requestId,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  }
}
