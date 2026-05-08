import { Card, CardContent } from "@/components/ui/card";
import type { RadarForecastAccountState } from "@/features/market-detail/contracts/radar-market-detail";

type RadarActivePositionCardProps = {
  position: NonNullable<RadarForecastAccountState["openPosition"]>;
};

export function RadarActivePositionCard({
  position,
}: RadarActivePositionCardProps) {
  return (
    <Card className="code-surface border-white/7 bg-market-surface/96 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.94)]">
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/36">
              Posicao ativa
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {position.sideLabel}
            </h2>
          </div>

          <p className="text-sm font-medium text-white/52">
            {position.sharesLabel}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-white/8 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/34">
              Investido
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {position.investedCreditsLabel}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/34">
              Valor atual
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {position.marketValueCreditsLabel}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/34">
              Delta aberto
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {position.unrealizedDeltaLabel}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/34">
              Preco medio
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {position.averageEntryPriceLabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
