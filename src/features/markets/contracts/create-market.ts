import { z } from "zod";

import { homeToneSchema } from "@/features/home/contracts/home-feed";

export const createPredictionMarketInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(12, "A pergunta principal precisa ter pelo menos 12 caracteres.")
    .max(180, "A pergunta principal pode ter no maximo 180 caracteres."),
  description: z
    .string()
    .trim()
    .min(24, "A descricao curta precisa ter pelo menos 24 caracteres.")
    .max(2_000, "A descricao curta pode ter no maximo 2000 caracteres."),
  overview: z
    .string()
    .trim()
    .min(24, "O overview precisa ter pelo menos 24 caracteres.")
    .max(2_000, "O overview pode ter no maximo 2000 caracteres."),
  category: z
    .string()
    .trim()
    .min(2, "Informe uma categoria com pelo menos 2 caracteres.")
    .max(48, "A categoria pode ter no maximo 48 caracteres."),
  subCategory: z
    .string()
    .trim()
    .min(2, "Informe uma subcategoria com pelo menos 2 caracteres.")
    .max(80, "A subcategoria pode ter no maximo 80 caracteres."),
  iconLabel: z
    .string()
    .trim()
    .min(1, "Informe uma sigla para o mercado.")
    .max(12, "A sigla pode ter no maximo 12 caracteres."),
  tone: homeToneSchema.default("primary"),
  yesLabel: z
    .string()
    .trim()
    .min(2, "O rotulo do lado sim precisa ter pelo menos 2 caracteres.")
    .max(60, "O rotulo do lado sim pode ter no maximo 60 caracteres."),
  noLabel: z
    .string()
    .trim()
    .min(2, "O rotulo do lado nao precisa ter pelo menos 2 caracteres.")
    .max(60, "O rotulo do lado nao pode ter no maximo 60 caracteres."),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Remova tags vazias da lista.")
        .max(32, "Cada tag pode ter no maximo 32 caracteres."),
    )
    .min(1, "Informe pelo menos uma tag.")
    .max(6, "Use no maximo 6 tags."),
  rules: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Remova regras vazias da lista.")
        .max(240, "Cada regra pode ter no maximo 240 caracteres."),
    )
    .min(1, "Informe pelo menos uma regra.")
    .max(6, "Use no maximo 6 regras."),
  context: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Remova linhas vazias do contexto.")
        .max(240, "Cada linha de contexto pode ter no maximo 240 caracteres."),
    )
    .min(1, "Informe pelo menos uma linha de contexto.")
    .max(6, "Use no maximo 6 linhas de contexto."),
  initialProbability: z
    .number({
      error: "Informe uma probabilidade inicial valida.",
    })
    .int("A probabilidade inicial precisa ser um numero inteiro.")
    .min(1, "A probabilidade inicial precisa ficar entre 1 e 99.")
    .max(99, "A probabilidade inicial precisa ficar entre 1 e 99."),
  closesAt: z.string().datetime({
    error: "Informe uma data de fechamento valida.",
  }),
});

export const createPredictionMarketResponseSchema = z.object({
  market: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
  }),
});

export const createPredictionMarketErrorResponseSchema = z.object({
  error: z.string(),
  requestId: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});

export type CreatePredictionMarketInput = z.infer<
  typeof createPredictionMarketInputSchema
>;
export type CreatePredictionMarketResponse = z.infer<
  typeof createPredictionMarketResponseSchema
>;
export type CreatePredictionMarketErrorResponse = z.infer<
  typeof createPredictionMarketErrorResponseSchema
>;
