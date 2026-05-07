"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPredictionMarketResponseSchema,
  type CreatePredictionMarketInput,
} from "@/features/markets/contracts/create-market";

const toneOptions: Array<{
  value: CreatePredictionMarketInput["tone"];
  label: string;
}> = [
  { value: "primary", label: "Primary" },
  { value: "sky", label: "Sky" },
  { value: "mint", label: "Mint" },
  { value: "gold", label: "Gold" },
  { value: "coral", label: "Coral" },
  { value: "slate", label: "Slate" },
];

type CreateMarketFormState = {
  title: string;
  description: string;
  overview: string;
  category: string;
  subCategory: string;
  iconLabel: string;
  tone: CreatePredictionMarketInput["tone"];
  yesLabel: string;
  noLabel: string;
  tagsInput: string;
  rulesInput: string;
  contextInput: string;
  initialProbability: string;
  closesAt: string;
};

function getInitialCloseDate() {
  const date = new Date();

  date.setDate(date.getDate() + 1);
  date.setMinutes(0, 0, 0);

  return date.toISOString().slice(0, 16);
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CreateMarketForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreateMarketFormState>({
    title: "",
    description: "",
    overview: "",
    category: "Infra",
    subCategory: "Janela monitorada",
    iconLabel: "NEW",
    tone: "primary",
    yesLabel: "Resolve",
    noLabel: "Nao resolve",
    tagsInput: "Infra, Comunidade",
    rulesInput:
      "Confirma se o fato principal acontecer dentro da janela observada.",
    contextInput: "Mercado criado pela comunidade autenticada do REAL Index.",
    initialProbability: "50",
    closesAt: getInitialCloseDate(),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/v1/markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          overview: formState.overview,
          category: formState.category,
          subCategory: formState.subCategory,
          iconLabel: formState.iconLabel,
          tone: formState.tone,
          yesLabel: formState.yesLabel,
          noLabel: formState.noLabel,
          tags: splitTags(formState.tagsInput),
          rules: splitLines(formState.rulesInput),
          context: splitLines(formState.contextInput),
          initialProbability: Number(formState.initialProbability),
          closesAt: new Date(formState.closesAt).toISOString(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Nao foi possivel criar esse mercado.",
        );
      }

      const result = createPredictionMarketResponseSchema.parse(payload);

      startTransition(() => {
        router.push(`/radar/${result.market.slug}`);
        router.refresh();
      });
      setStatus("idle");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel criar esse mercado.",
      );
    }
  }

  return (
    <Card className="code-surface border-white/7 bg-market-surface/96 shadow-[0_30px_90px_-42px_rgba(0,0,0,0.96)]">
      <CardHeader className="space-y-3 px-5 pt-5">
        <CardTitle className="text-2xl text-white">
          Publicar novo mercado
        </CardTitle>
        <p className="text-sm leading-6 text-white/52">
          O mercado entra direto no radar ativo, aparece na home e ja nasce com
          o primeiro snapshot persistido no banco.
        </p>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="market-title">Pergunta principal</Label>
              <Input
                id="market-title"
                value={formState.title}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    title: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
                placeholder="O deploy vai estabilizar antes do pico da comunidade?"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="market-description">Descricao curta</Label>
              <Textarea
                id="market-description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 rounded-xl border-white/8 bg-white/4 text-white"
                placeholder="Resumo rapido do evento acompanhado."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="market-overview">Overview do detalhe</Label>
              <Textarea
                id="market-overview"
                value={formState.overview}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    overview: event.target.value,
                  }))
                }
                className="min-h-28 rounded-xl border-white/8 bg-white/4 text-white"
                placeholder="Contexto que sera exibido na pagina de detalhe."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-category">Categoria</Label>
              <Input
                id="market-category"
                value={formState.category}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    category: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-subcategory">Subcategoria</Label>
              <Input
                id="market-subcategory"
                value={formState.subCategory}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    subCategory: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-icon">Sigla</Label>
              <Input
                id="market-icon"
                value={formState.iconLabel}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    iconLabel: event.target.value.toUpperCase(),
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white uppercase"
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-tone">Tom visual</Label>
              <select
                id="market-tone"
                value={formState.tone}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    tone: event.target
                      .value as CreatePredictionMarketInput["tone"],
                  }))
                }
                className="h-11 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-sm text-white outline-none"
              >
                {toneOptions.map((toneOption) => (
                  <option key={toneOption.value} value={toneOption.value}>
                    {toneOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-yes">Rotulo do lado sim</Label>
              <Input
                id="market-yes"
                value={formState.yesLabel}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    yesLabel: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-no">Rotulo do lado nao</Label>
              <Input
                id="market-no"
                value={formState.noLabel}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    noLabel: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-probability">Probabilidade inicial</Label>
              <Input
                id="market-probability"
                type="number"
                min={1}
                max={99}
                value={formState.initialProbability}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    initialProbability: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-close">Janela de fechamento</Label>
              <Input
                id="market-close"
                type="datetime-local"
                value={formState.closesAt}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    closesAt: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="market-tags">Tags separadas por virgula</Label>
              <Input
                id="market-tags"
                value={formState.tagsInput}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    tagsInput: event.target.value,
                  }))
                }
                className="h-11 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-rules">Regras, uma por linha</Label>
              <Textarea
                id="market-rules"
                value={formState.rulesInput}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    rulesInput: event.target.value,
                  }))
                }
                className="min-h-32 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-context">Contexto, um por linha</Label>
              <Textarea
                id="market-context"
                value={formState.contextInput}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    contextInput: event.target.value,
                  }))
                }
                className="min-h-32 rounded-xl border-white/8 bg-white/4 text-white"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm leading-6 text-market-warning">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-5 text-white/44">
              Depois de publicado, o mercado entra na home, ganha URL propria e
              ja pode receber snapshots reais no proximo passo de negociacao.
            </p>
            <Button
              type="submit"
              className="h-11 rounded-2xl px-5"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Publicando..." : "Publicar mercado"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
