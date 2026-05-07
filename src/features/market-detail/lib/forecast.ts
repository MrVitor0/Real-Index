import type { RadarForecastPreviewResponse } from "@/features/market-detail/contracts/radar-market-detail";

type BuildForecastPreviewInput = {
  credits: number;
  score: number;
  positionLabel: string;
};

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseCreditsInput(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits ? Number(digits) : 0;
}

export function formatCredits(value: number) {
  return `${numberFormatter.format(Math.max(0, Math.round(value)))} REAL Credits`;
}

export function formatCreditsInput(value: string | number) {
  const credits =
    typeof value === "number"
      ? Math.max(0, Math.round(value))
      : parseCreditsInput(value);

  if (credits === 0) {
    return "";
  }

  return formatCredits(credits);
}

export function formatCompactCredits(value: number) {
  if (value >= 1000) {
    return `${numberFormatter.format(value / 1000)} mil REAL Credits`;
  }

  return formatCredits(value);
}

export function formatQuickCreditsLabel(value: number) {
  return `+${numberFormatter.format(value)}`;
}

export function probabilityToSignalScore(probability: number) {
  return clamp(Math.round(probability), 1, 99);
}

export function invertSignalScore(score: number) {
  return clamp(100 - score, 1, 99);
}

export function formatSignalScore(score: number) {
  return `${score} pts`;
}

function buildConvictionLabel(credits: number) {
  if (credits >= 500) {
    return "Conviccao alta";
  }

  if (credits >= 250) {
    return "Conviccao moderada";
  }

  return "Conviccao inicial";
}

export function buildForecastPreview({
  credits,
  score,
  positionLabel,
}: BuildForecastPreviewInput): RadarForecastPreviewResponse {
  const normalizedCredits = Math.max(0, Math.round(credits));
  const normalizedScore = clamp(Math.round(score), 1, 99);
  const estimatedReach = normalizedCredits / normalizedScore;
  const convictionLabel = buildConvictionLabel(normalizedCredits);

  return {
    kind: "entry",
    actionLabel: "Confirmar forecast",
    positionLabel,
    credits: normalizedCredits,
    creditsLabel: formatCredits(normalizedCredits),
    sharesLabel: `${numberFormatter.format(estimatedReach)} blocos de sinal`,
    balanceAfterLabel: formatCredits(0),
    deltaLabel: `Score ${formatSignalScore(normalizedScore)}`,
    exposureLabel: convictionLabel,
    helperLabel: "Preview local enquanto o servidor valida a operacao.",
  };
}
