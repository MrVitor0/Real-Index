import type { Route } from "next";
import Link from "next/link";

type ForecastPositionCard = {
  id: string;
  slug: string;
  title: string;
  probability: number;
  sideLabel: string;
  sharesLabel: string;
  investedCreditsLabel: string;
  marketValueCreditsLabel: string;
  unrealizedDeltaLabel: string;
  closeLabel: string;
};

type ForecastPositionsGridProps = {
  positions: ForecastPositionCard[];
  emptyMessage: string;
};

export function ForecastPositionsGrid({
  positions,
  emptyMessage,
}: ForecastPositionsGridProps) {
  if (positions.length === 0) {
    return <p className="text-sm leading-7 text-white/52">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {positions.map((position) => (
        <Link
          key={position.id}
          href={`/radar/${position.slug}` as Route}
          className="rounded-[24px] border border-white/8 bg-white/3 p-4 transition-colors hover:bg-white/6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/34">
                {position.sideLabel}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {position.title}
              </h3>
            </div>

            <span className="text-lg font-semibold text-white">
              {position.probability}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/56">
            <div>
              <p>Cotas</p>
              <p className="mt-1 font-semibold text-white/84">
                {position.sharesLabel}
              </p>
            </div>
            <div>
              <p>Em jogo</p>
              <p className="mt-1 font-semibold text-white/84">
                {position.investedCreditsLabel}
              </p>
            </div>
            <div>
              <p>Valor atual</p>
              <p className="mt-1 font-semibold text-white/84">
                {position.marketValueCreditsLabel}
              </p>
            </div>
            <div>
              <p>Delta</p>
              <p className="mt-1 font-semibold text-white/84">
                {position.unrealizedDeltaLabel}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/46">
            Fecha em {position.closeLabel}
          </p>
        </Link>
      ))}
    </div>
  );
}
