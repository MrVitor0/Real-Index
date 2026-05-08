import { randomInt } from "node:crypto";

import {
  deleteRandomRedemptionResultSchema,
  type DeleteRandomRedemptionResult,
} from "@/features/marketplace/contracts/marketplace";

export const deleteRandomRewardId = "b1cd0a7a-fdfb-495e-8f41-7ad7ca968ec7";
export const deleteRandomRewardSlug = "delete-random";

const deleteRandomWheelSegments = [
  {
    key: "phrase",
    label: "Frase",
    description: "Uma frase do site acabou de entrar na mira da limpeza.",
    reviewHint: "Registrar a frase escolhida antes da remocao manual.",
    weight: 34,
    color: "#78350f",
    textColor: "#ffffff",
  },
  {
    key: "component",
    label: "Componente",
    description: "Um componente da interface virou alvo do giro.",
    reviewHint: "Registrar o componente escolhido antes da remocao manual.",
    weight: 28,
    color: "#1e3a8a",
    textColor: "#ffffff",
  },
  {
    key: "market",
    label: "Mercado",
    description: "Um mercado entrou no caminho do sumico.",
    reviewHint: "Registrar o mercado escolhido antes da remocao manual.",
    weight: 18,
    color: "#14532d",
    textColor: "#ffffff",
  },
  {
    key: "user",
    label: "Perfil",
    description: "Um perfil acabou entrando na zona de risco.",
    reviewHint: "Registrar o perfil escolhido antes da remocao manual.",
    weight: 12,
    color: "#7f1d1d",
    textColor: "#ffffff",
  },
  {
    key: "ranking",
    label: "Ranking",
    description: "Uma peca do ranking virou candidata ao corte.",
    reviewHint: "Registrar o ajuste sorteado antes da remocao manual.",
    weight: 6,
    color: "#4c1d95",
    textColor: "#ffffff",
  },
  {
    key: "database",
    label: "Banco de dados",
    description: "O giro raro apontou para uma limpeza de dados.",
    reviewHint: "Exigir revisao manual antes de qualquer acao real.",
    weight: 2,
    color: "#1f2937",
    textColor: "#ffffff",
  },
] as const;

type MarketplaceRewardEffectTarget = {
  id: string;
  slug: string;
};

function getDeleteRandomTotalWeight() {
  return deleteRandomWheelSegments.reduce(
    (totalWeight, segment) => totalWeight + segment.weight,
    0,
  );
}

export function isDeleteRandomReward(reward: MarketplaceRewardEffectTarget) {
  return (
    reward.id === deleteRandomRewardId || reward.slug === deleteRandomRewardSlug
  );
}

export function pickDeleteRandomOutcome(
  roll = randomInt(getDeleteRandomTotalWeight()),
) {
  const totalWeight = getDeleteRandomTotalWeight();

  if (roll < 0 || roll >= totalWeight) {
    throw new Error("Invalid delete-random roll.");
  }

  let accumulatedWeight = 0;

  for (const segment of deleteRandomWheelSegments) {
    accumulatedWeight += segment.weight;

    if (roll < accumulatedWeight) {
      return segment;
    }
  }

  return deleteRandomWheelSegments[deleteRandomWheelSegments.length - 1];
}

export function createMarketplaceRedemptionResult(
  reward: MarketplaceRewardEffectTarget,
): DeleteRandomRedemptionResult | null {
  if (!isDeleteRandomReward(reward)) {
    return null;
  }

  const outcome = pickDeleteRandomOutcome();

  return deleteRandomRedemptionResultSchema.parse({
    kind: "delete-random",
    title: "O que você vai apagar do Real Index?",
    subtitle: "Vamos girar a roleta para descobrir o alvo da limpeza.",
    outcome,
    segments: deleteRandomWheelSegments,
    createdAt: new Date().toISOString(),
  });
}
