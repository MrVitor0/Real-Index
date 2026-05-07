import Link from "next/link";
import {
  ArrowUpRight,
  Blocks,
  DatabaseZap,
  Gauge,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
  Workflow,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEnvironmentStatus } from "@/lib/env";

type SetupTrack = {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
};

const setupTracks: SetupTrack[] = [
  {
    title: "Frontend architecture",
    description:
      "Base com App Router, Tailwind CSS v4 e componentes reutilizáveis do shadcn/ui.",
    icon: Blocks,
    items: [
      "Server Components por padrão e estrutura pronta para Client Components quando necessário.",
      "Tokens visuais centralizados no globals.css com tema claro e contraste consistente.",
      "Kit inicial do shadcn/ui com Button, Card, Badge, Input, Dialog, Sheet e mais.",
    ],
  },
  {
    title: "Backend foundation",
    description:
      "Camadas separadas para banco, cache e validação de ambiente, prontas para Route Handlers e Server Actions.",
    icon: DatabaseZap,
    items: [
      "Neon PostgreSQL configurado via @neondatabase/serverless.",
      "Drizzle ORM com schema inicial e scripts de generate, push e studio.",
      "Upstash Redis com client próprio e helper inicial de rate limiting.",
    ],
  },
  {
    title: "DX e segurança",
    description:
      "Setup inicial para desenvolvimento limpo, tipado e com pouca fricção para evoluir o MVP.",
    icon: ShieldCheck,
    items: [
      "TypeScript strict, lint, typecheck e typed routes ativos no Next.js.",
      "Variáveis de ambiente validadas com Zod antes de abrir conexões sensíveis.",
      "Estrutura preparada para autenticação, perfis públicos e sistemas de previsão.",
    ],
  },
];

const commandList = [
  "npm run dev",
  "npm run check",
  "npm run db:generate",
  "npm run db:push",
  "npm run db:studio",
];

const nextSteps = [
  "Copiar .env.example para .env e preencher Neon + Upstash.",
  "Gerar a primeira migration do Drizzle quando o schema estiver refinado.",
  "Subir a camada de autenticação e perfis sobre a base já tipada.",
];

function StatusChip({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <span className="text-sm font-medium text-foreground/88">{label}</span>
      <Badge
        variant="outline"
        className={
          active
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground"
        }
      >
        {active ? "ok" : "pendente"}
      </Badge>
    </div>
  );
}

function TrackCard({ track }: { track: SetupTrack }) {
  const Icon = track.icon;

  return (
    <Card className="border-border/70 bg-card/88 shadow-sm backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl text-foreground">
            {track.title}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-muted-foreground">
            {track.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {track.items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 text-sm leading-6 text-foreground/82"
          >
            <span className="mt-2 h-2 w-2 rounded-full bg-primary/70" />
            <p>{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const environmentStatus = getEnvironmentStatus();

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,oklch(0.94_0.05_92/.95),transparent_56%)]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:px-10 lg:px-12 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <Card className="overflow-hidden border-border/70 bg-card/88 shadow-sm backdrop-blur">
            <CardContent className="flex h-full flex-col gap-8 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                <Badge className="rounded-full bg-primary/12 px-3 py-1 text-primary hover:bg-primary/12">
                  Phase 1 foundation
                </Badge>
                <span>Next.js 16</span>
                <span>TypeScript strict</span>
                <span>Neon + Drizzle + Upstash</span>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Scaffold inicial pronto para o MVP
                </div>
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
                  REAL Severity Index com base moderna de frontend e backend já
                  integrada.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  O projeto agora nasce com App Router, Tailwind CSS v4,
                  shadcn/ui, Neon PostgreSQL, Drizzle ORM e Upstash Redis
                  organizados em camadas simples, tipadas e prontas para crescer
                  sem gambiarra.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={siteConfig.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    size: "lg",
                    className: "rounded-full px-6",
                  })}
                >
                  Repositório
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href={siteConfig.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className: "rounded-full px-6",
                  })}
                >
                  shadcn/ui docs
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Frontend
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    Next + Tailwind + shadcn
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Database
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    Neon + Drizzle
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Cache
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    Upstash Redis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-sm backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60 text-secondary-foreground">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl text-foreground">
                  Status do ambiente
                </CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                  O setup já está no projeto. Falta apenas preencher o .env para
                  liberar banco, cache e scripts de dados.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <StatusChip
                  active={environmentStatus.hasDatabase}
                  label="DATABASE_URL / Neon"
                />
                <StatusChip
                  active={environmentStatus.hasRedis}
                  label="UPSTASH_REDIS_* / Redis"
                />
                <StatusChip
                  active={environmentStatus.hasPublicAppUrl}
                  label="NEXT_PUBLIC_APP_URL"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Scripts úteis
                </p>
                <div className="grid gap-2">
                  {commandList.map((command) => (
                    <div
                      key={command}
                      className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 font-mono text-sm text-foreground/86"
                    >
                      {command}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-primary/15 bg-primary/8 p-4 text-sm leading-6 text-foreground/86">
                Base URL atual:{" "}
                <span className="font-mono text-primary">
                  {environmentStatus.publicAppUrl}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {setupTracks.map((track) => (
            <TrackCard key={track.title} track={track} />
          ))}
        </div>

        <Card className="border-border/70 bg-card/88 shadow-sm backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-primary">
              <Workflow className="h-4 w-4" />
              Próximos passos imediatos
            </div>
            <CardTitle className="text-2xl text-foreground">
              O que já ficou pronto para a próxima fase
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground">
              A fundação já suporta autenticação, perfis públicos, CRUD de
              predictions, reputação e features em tempo real sem precisar
              refatorar a espinha dorsal do projeto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3 rounded-3xl border border-border/70 bg-background/80 p-5">
              {nextSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 text-sm leading-6 text-foreground/86"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-xs font-semibold text-primary">
                    0{index + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-3xl border border-border/70 bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Arquitetura
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                Separação simples e escalável
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Os utilitários de ambiente ficam em lib, integrações de
                infraestrutura ficam em server e o App Router continua limpo
                para páginas, layouts e futuras rotas protegidas.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
