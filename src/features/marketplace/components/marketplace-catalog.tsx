"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BrushCleaning,
  Gift,
  Layers3,
  LoaderCircle,
  Ticket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { dispatchNavbarBalanceSync } from "@/features/account/lib/navbar-balance-sync";
import { DeleteRandomRouletteDialog } from "@/features/marketplace/components/delete-random-roulette-dialog";
import type {
  DeleteRandomRedemptionResult,
  MarketplaceCatalog,
  MarketplaceRedeemResponse,
  MarketplaceReward,
} from "@/features/marketplace/contracts/marketplace";
import { marketplaceRedeemResponseSchema } from "@/features/marketplace/contracts/marketplace";
import { cn } from "@/lib/utils";

type MarketplaceCatalogProps = {
  initialCatalog: MarketplaceCatalog;
};

type FeedbackState = {
  kind: "success" | "error";
  message: string;
};

const redemptionStatusMap = {
  pending: {
    label: "Pendente",
    className: "border-amber-400/20 bg-amber-400/12 text-amber-200",
  },
  fulfilled: {
    label: "Aplicado",
    className: "border-emerald-400/20 bg-emerald-400/12 text-emerald-200",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-rose-400/20 bg-rose-400/12 text-rose-200",
  },
} as const;

function updateCatalogAfterRedeem(
  catalog: MarketplaceCatalog,
  response: MarketplaceRedeemResponse,
) {
  return {
    ...catalog,
    balance: response.balance,
    rewards: catalog.rewards.map((reward) => {
      const redemptionCount =
        reward.id === response.redemption.rewardId
          ? reward.redemptionCount + 1
          : reward.redemptionCount;
      const isRedeemed = redemptionCount >= reward.redemptionLimit;

      return {
        ...reward,
        redemptionCount,
        isRedeemed,
        canRedeem:
          !isRedeemed && reward.creditCost <= response.balance.availableCredits,
      };
    }),
    redemptions: [response.redemption, ...catalog.redemptions].slice(0, 8),
  } satisfies MarketplaceCatalog;
}

function MarketplaceRewardCard(props: {
  reward: MarketplaceReward;
  authStatus: MarketplaceCatalog["balance"]["authStatus"];
  pending: boolean;
  onRedeem: (rewardId: string) => Promise<void>;
}) {
  const { reward, authStatus, pending, onRedeem } = props;
  const actionLabel = pending
    ? "Processando"
    : authStatus === "anonymous"
      ? "Entre para resgatar"
      : reward.isRedeemed
        ? "Limite atingido"
        : reward.canRedeem
          ? "Trocar agora"
          : "Saldo insuficiente";
  const isActionEnabled = authStatus === "authenticated" && reward.canRedeem;

  return (
    <article className="group relative h-145 overflow-hidden rounded-[30px] border border-white/10 bg-(--market-surface)/92 shadow-[0_28px_80px_-48px_rgba(0,0,0,0.9)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url("${reward.backgroundImageUrl}")` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.12)_0%,rgba(3,7,18,0.78)_45%,rgba(3,7,18,0.96)_100%)]" />

      <div className="relative flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge className="rounded-full border border-white/14 bg-black/35 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/35">
            {reward.creditCostLabel}
          </Badge>
          {reward.redemptionCount > 0 ? (
            <Badge
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-sm",
                reward.isRedeemed
                  ? "border border-amber-400/22 bg-amber-400/12 text-amber-100 hover:bg-amber-400/12"
                  : "border border-sky-400/22 bg-sky-400/12 text-sky-100 hover:bg-sky-400/12",
              )}
            >
              {reward.redemptionCount}/{reward.redemptionLimit} resgates
            </Badge>
          ) : (
            <span className="rounded-full border border-white/10 bg-black/20 p-2 text-white/72 backdrop-blur-sm">
              <Gift className="h-4 w-4" />
            </span>
          )}
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/55">
            Marketplace
          </p>
          <h2 className="mt-3 max-w-[18ch] text-2xl font-semibold text-white">
            {reward.title}
          </h2>
          <p className="mt-3 max-w-[34ch] text-sm leading-6 text-white/72">
            {reward.subtitle}
          </p>

          <button
            type="button"
            disabled={pending || !isActionEnabled}
            onClick={() => onRedeem(reward.id)}
            className={cn(
              "mt-6 inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition-colors enabled:cursor-pointer",
              isActionEnabled
                ? "bg-white text-slate-950 hover:bg-white/90 disabled:bg-white/70"
                : "border border-white/10 bg-white/6 text-white/50",
            )}
          >
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {actionLabel}
              </>
            ) : isActionEnabled ? (
              <>
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export function MarketplaceCatalog({
  initialCatalog,
}: MarketplaceCatalogProps) {
  const router = useRouter();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [deleteRandomResult, setDeleteRandomResult] =
    useState<DeleteRandomRedemptionResult | null>(null);
  const [shouldRefreshAfterRoulette, setShouldRefreshAfterRoulette] =
    useState(false);
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  async function handleRedeem(rewardId: string) {
    setPendingRewardId(rewardId);
    setFeedback(null);

    try {
      const response = await fetch("/api/v1/marketplace/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "Nao foi possivel concluir esse resgate agora.",
        );
      }

      const parsedResponse = marketplaceRedeemResponseSchema.parse(payload);

      setCatalog((currentCatalog) =>
        updateCatalogAfterRedeem(currentCatalog, parsedResponse),
      );
      dispatchNavbarBalanceSync(parsedResponse.balance);
      setFeedback({
        kind: "success",
        message: parsedResponse.message,
      });

      if (parsedResponse.redemption.result?.kind === "delete-random") {
        setDeleteRandomResult(parsedResponse.redemption.result);
        setShouldRefreshAfterRoulette(true);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir esse resgate agora.",
      });
    } finally {
      setPendingRewardId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_28%),rgba(9,13,24,0.92)] shadow-[0_36px_120px_-72px_rgba(15,23,42,1)]">
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
          <div>
            <Badge className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium text-sky-100 hover:bg-sky-400/10">
              Troca sem valor monetario
            </Badge>
            <h1 className="mt-3 max-w-[24ch] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Marketplace da comunidade.
            </h1>
            <p className="mt-2 max-w-[62ch] text-sm leading-6 text-white/68">
              {catalog.helperDescription}
            </p>

            {feedback ? (
              <div
                className={cn(
                  "mt-4 rounded-[24px] border px-4 py-3 text-sm",
                  feedback.kind === "success"
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border-rose-400/20 bg-rose-400/10 text-rose-100",
                )}
              >
                {feedback.message}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[26px] border border-white/10 bg-black/24 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-white/72">
                <Ticket className="h-4 w-4 text-sky-200" />
                <span className="text-sm">Saldo pronto para trocar</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-white">
                {catalog.balance.availableCreditsLabel}
              </p>
              <p className="mt-1.5 text-sm text-white/52">
                Seu saldo atual define quais perks destravam agora.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 md:grid-cols-2">
          {catalog.rewards.length > 0 ? (
            catalog.rewards.map((reward) => (
              <MarketplaceRewardCard
                key={reward.id}
                reward={reward}
                authStatus={catalog.balance.authStatus}
                pending={pendingRewardId === reward.id}
                onRedeem={handleRedeem}
              />
            ))
          ) : (
            <div className="rounded-[30px] border border-dashed border-white/12 bg-(--market-surface)/92 p-8 text-white/68 md:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                Sem itens publicados
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                O marketplace ainda esta vazio.
              </h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-7 text-white/58">
                Cadastre perks diretamente na tabela marketplace_rewards para
                exibir titulo, subtitulo, imagem e valor para a comunidade.
              </p>
            </div>
          )}
        </div>

        <aside className="grid gap-4 self-start">
          <section className="rounded-[30px] border border-white/10 bg-(--market-surface)/92 p-6 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-3">
              <BrushCleaning className="h-4 w-4 text-primary" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Como funciona
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Perks de produto e comunidade
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm leading-7 text-white/64">
              <p>
                Os itens podem liberar mudancas visuais, prioridade para novos
                mercados ou outras ativacoes nao financeiras cadastradas pelo
                banco.
              </p>
              <p>
                Cada troca cria um resgate pendente para acompanhamento interno
                e debita apenas REAL Credits virtuais do seu saldo atual.
              </p>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-(--market-surface)/92 p-6 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-3">
              <Layers3 className="h-4 w-4 text-primary" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Resgates recentes
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Fila da sua conta
                </h2>
              </div>
            </div>

            {catalog.redemptions.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {catalog.redemptions.map((redemption) => {
                  const status = redemptionStatusMap[redemption.status];

                  return (
                    <div
                      key={redemption.id}
                      className="rounded-[22px] border border-white/8 bg-white/4 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {redemption.rewardTitle}
                          </p>
                          <p className="mt-1 text-xs text-white/46">
                            {redemption.createdAtLabel}
                          </p>
                          {redemption.result ? (
                            <p className="mt-2 text-xs text-amber-100/76">
                              Resultado: {redemption.result.outcome.label}
                            </p>
                          ) : null}
                        </div>

                        <Badge
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] hover:bg-transparent",
                            status.className,
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/62">
                        <span>{redemption.creditsSpentLabel}</span>
                        <span className="inline-flex items-center gap-2 text-white/48">
                          <BadgeCheck className="h-4 w-4" />
                          registrado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/58">
                Nenhum resgate recente por aqui. Quando voce trocar credits por
                um perk, a fila da conta aparece neste painel.
              </p>
            )}
          </section>
        </aside>
      </section>

      <DeleteRandomRouletteDialog
        key={deleteRandomResult?.createdAt ?? "delete-random-roulette"}
        result={deleteRandomResult}
        open={Boolean(deleteRandomResult)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRandomResult(null);

            if (shouldRefreshAfterRoulette) {
              setShouldRefreshAfterRoulette(false);
              startTransition(() => {
                router.refresh();
              });
            }
          }
        }}
      />
    </div>
  );
}
