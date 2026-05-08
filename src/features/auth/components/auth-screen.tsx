import type { Route } from "next";
import { ShieldCheck, Sparkles, UserRound } from "lucide-react";
import {
  AuthView,
  type AuthLocalization,
  type AuthViewPath,
} from "@neondatabase/auth/react/ui";
import { redirect } from "next/navigation";

import { AppNavbar } from "@/components/navigation/app-navbar";
import { RealLogoLockup } from "@/components/branding/real-logo";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { getServerSession } from "@/lib/auth/server";
import { getEnvironmentStatus } from "@/lib/env";

export const supportedAuthViews = [
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
] as const;

export type SupportedAuthView = (typeof supportedAuthViews)[number];

const accountRoute = "/conta" as Route;

const authFeatureIcons = {
  shield: ShieldCheck,
  sparkles: Sparkles,
  user: UserRound,
} as const;

const authViewLocalization = {
  ALREADY_HAVE_AN_ACCOUNT: "Ja tem uma conta?",
  CONFIRM_PASSWORD: "Confirmar senha",
  CONFIRM_PASSWORD_PLACEHOLDER: "Confirme sua senha",
  CONFIRM_PASSWORD_REQUIRED: "A confirmacao de senha e obrigatoria",
  DONT_HAVE_AN_ACCOUNT: "Ainda nao tem uma conta?",
  EMAIL: "Email",
  EMAIL_DESCRIPTION: "Digite o email que voce quer usar para acessar a conta.",
  EMAIL_INSTRUCTIONS: "Digite um endereco de email valido.",
  EMAIL_PLACEHOLDER: "voce@exemplo.com",
  EMAIL_REQUIRED: "O email e obrigatorio",
  FORGOT_PASSWORD: "Recuperar senha",
  FORGOT_PASSWORD_ACTION: "Enviar link de recuperacao",
  FORGOT_PASSWORD_DESCRIPTION:
    "Digite seu email para receber o link de redefinicao.",
  FORGOT_PASSWORD_EMAIL:
    "Confira seu email para abrir o link de redefinicao de senha.",
  FORGOT_PASSWORD_LINK: "Esqueceu sua senha?",
  NAME: "Nome",
  NAME_DESCRIPTION: "Digite seu nome completo ou como voce quer aparecer.",
  NAME_PLACEHOLDER: "Seu nome",
  NEW_PASSWORD: "Nova senha",
  NEW_PASSWORD_PLACEHOLDER: "Digite sua nova senha",
  NEW_PASSWORD_REQUIRED: "A nova senha e obrigatoria",
  OR_CONTINUE_WITH: "Ou continue com",
  PASSWORD: "Senha",
  PASSWORD_PLACEHOLDER: "Digite sua senha",
  PASSWORD_REQUIRED: "A senha e obrigatoria",
  PASSWORDS_DO_NOT_MATCH: "As senhas nao coincidem",
  RESET_PASSWORD: "Redefinir senha",
  RESET_PASSWORD_ACTION: "Salvar nova senha",
  RESET_PASSWORD_DESCRIPTION:
    "Digite sua nova senha para voltar a acessar a conta.",
  SIGN_IN: "Entrar",
  SIGN_IN_ACTION: "Entrar",
  SIGN_IN_DESCRIPTION: "Digite seus dados para acessar sua conta.",
  SIGN_IN_USERNAME_DESCRIPTION:
    "Digite seu usuario ou email para acessar sua conta.",
  SIGN_IN_USERNAME_PLACEHOLDER: "Usuario ou email",
  SIGN_IN_WITH: "Continuar com",
  SIGN_UP: "Criar conta",
  SIGN_UP_ACTION: "Criar conta",
  SIGN_UP_DESCRIPTION: "Preencha seus dados para criar sua conta.",
  SIGN_UP_EMAIL: "Confira seu email para validar a criacao da conta.",
  USERNAME: "Usuario",
  USERNAME_DESCRIPTION:
    "Digite o usuario que voce quer usar para acessar a conta.",
  USERNAME_INSTRUCTIONS: "Use no maximo 32 caracteres.",
  USERNAME_PLACEHOLDER: "Seu usuario",
} satisfies AuthLocalization;

const authViewCopy: Record<
  SupportedAuthView,
  {
    badge: string;
    title: string;
    description: string;
    featureCards: Array<{
      icon: keyof typeof authFeatureIcons;
      title: string;
      description: string;
    }>;
  }
> = {
  "sign-in": {
    badge: "Login",
    title: "Acesse sua conta.",
    description:
      "Entre para acompanhar forecasts, sinais e rankings da comunidade no REAL Severity Index.",
    featureCards: [
      {
        icon: "shield",
        title: "Entre com seu email",
        description:
          "Use seu email e senha para acessar sua conta de forma direta.",
      },

      {
        icon: "user",
        title: "Radar da comunidade",
        description:
          "As areas privadas liberam historico de sinais, reputacao e sua trilha dentro do ranking.",
      },
    ],
  },
  "sign-up": {
    badge: "Cadastro",
    title: "Crie sua conta.",
    description:
      "Cadastre-se para registrar conviccoes, subir no ranking e acompanhar o pulso da comunidade tech.",
    featureCards: [
      {
        icon: "shield",
        title: "Cadastro rapido",
        description: "Preencha seus dados e crie sua conta em poucos passos.",
      },
      {
        icon: "sparkles",
        title: "REAL Credits virtuais",
        description:
          "Sua progressao usa creditos de comunidade, sem compra de dinheiro e sem saque.",
      },
      {
        icon: "user",
        title: "Conta pronta para entrar",
        description:
          "Depois do cadastro, sua conta ja fica pronta para forecasts, reputacao e historico de atividade.",
      },
    ],
  },
  "forgot-password": {
    badge: "Recuperacao",
    title: "Recupere o acesso.",
    description:
      "Informe seu email para receber o link e redefinir sua senha com seguranca.",
    featureCards: [
      {
        icon: "shield",
        title: "Recuperacao segura",
        description:
          "O link de redefinicao e enviado para o email da sua conta.",
      },
      {
        icon: "sparkles",
        title: "Passo a passo simples",
        description:
          "Abra o link recebido, escolha uma nova senha e volte a entrar.",
      },
      {
        icon: "user",
        title: "Sem criar outra conta",
        description:
          "Voce recupera o acesso da mesma conta, sem precisar se cadastrar novamente.",
      },
    ],
  },
  "reset-password": {
    badge: "Nova senha",
    title: "Defina uma nova senha.",
    description:
      "Escolha uma senha nova para voltar a acessar sua conta normalmente.",
    featureCards: [
      {
        icon: "shield",
        title: "Atualizacao segura",
        description:
          "A nova senha substitui a anterior assim que voce concluir esta etapa.",
      },
      {
        icon: "sparkles",
        title: "Volte a entrar",
        description:
          "Depois de salvar, o login pode ser feito normalmente com a nova senha.",
      },
      {
        icon: "user",
        title: "Mesma conta, novo acesso",
        description:
          "Seu acesso continua na mesma conta, sem perder o historico da plataforma.",
      },
    ],
  },
};

export function isSupportedAuthView(view: string): view is SupportedAuthView {
  return supportedAuthViews.includes(view as SupportedAuthView);
}

type AuthScreenProps = {
  view: SupportedAuthView;
};

export async function AuthScreen({ view }: AuthScreenProps) {
  const environment = getEnvironmentStatus();
  const copy = authViewCopy[view];
  const visibleFeatureCards = copy.featureCards.slice(0, 2);

  if (environment.hasNeonAuth && (view === "sign-in" || view === "sign-up")) {
    const session = await getServerSession();

    if (session?.user) {
      redirect(accountRoute);
    }
  }

  return (
    <>
      <AppNavbar />

      <main className="relative overflow-hidden bg-background px-4 pb-10 pt-4 text-foreground md:px-6 md:pb-12 md:pt-5 lg:px-8">
        <div className="texture-grid pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <section className="surface-noise flex h-full min-h-137 flex-col justify-between rounded-[32px] border border-white/8 bg-(--market-surface)/92 p-8 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] md:p-10">
              <div className="space-y-6">
                <RealLogoLockup
                  eyebrow="forecast social"
                  subtitle={siteConfig.tagline}
                  markClassName="h-12 w-12"
                  titleClassName="text-xl md:text-2xl"
                  subtitleClassName="whitespace-normal leading-6"
                />

                <Badge className="w-fit rounded-full border border-primary/20 bg-primary/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-primary hover:bg-primary/12">
                  {copy.badge}
                </Badge>

                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                    {copy.title}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/62 md:text-lg">
                    {copy.description}
                  </p>
                </div>

                <div className="rounded-3xl border border-primary/15 bg-primary/8 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/82">
                    experiencia legal e gamificada
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {siteConfig.legalDisclaimer}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 pt-8 md:grid-cols-2">
                {visibleFeatureCards.map((card) => {
                  const Icon = authFeatureIcons[card.icon];

                  return (
                    <div
                      key={card.title}
                      className="rounded-3xl border border-white/8 bg-white/4 p-4"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <p className="mt-4 text-sm font-medium text-white">
                        {card.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/52">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {environment.hasNeonAuth ? (
              <AuthView
                path={view as AuthViewPath}
                localization={authViewLocalization}
                className="surface-noise h-full min-h-137 max-w-none rounded-[32px] border-white/8 bg-(--market-surface)/92 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]"
                classNames={{
                  header: "px-8 pb-4 pt-8 md:px-10 md:pt-10",
                  title: "text-3xl font-semibold tracking-tight text-white",
                  description: "text-sm leading-7 text-white/58",
                  content:
                    "flex h-full flex-col justify-between gap-8 px-8 pb-8 md:px-10 md:pb-10",
                  continueWith: "text-white/42",
                  form:
                    view === "sign-up"
                      ? {
                          primaryButton: "min-h-14 text-base font-semibold",
                          providerButton: "min-h-14 text-base font-semibold",
                        }
                      : undefined,
                  separator: "bg-white/10",
                  footer: "text-white/48",
                  footerLink: "text-primary hover:text-primary/82",
                }}
              />
            ) : (
              <section className="h-full min-h-137 rounded-[32px] border border-white/8 bg-market-surface/96 p-5 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] md:p-6">
                <div className="flex h-full flex-col justify-between gap-6 rounded-[28px] border border-dashed border-white/12 bg-white/3 p-6">
                  <div className="space-y-4">
                    <Badge className="w-fit rounded-full border border-market-warning/20 bg-market-warning/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-market-warning hover:bg-market-warning/12">
                      Configuracao pendente
                    </Badge>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                      Falta conectar o Neon Auth antes de usar login e cadastro.
                    </h2>
                    <p className="text-sm leading-7 text-white/58">
                      Defina NEON_AUTH_BASE_URL e NEON_AUTH_COOKIE_SECRET no
                      .env, depois reinicie o servidor. Assim a API /api/auth e
                      o login com Google ficam operacionais.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/8 bg-white/4 p-4 font-mono text-xs leading-6 text-white/60">
                    <div>NEON_AUTH_BASE_URL=https://...</div>
                    <div>NEON_AUTH_COOKIE_SECRET=...</div>
                    <div>NEXT_PUBLIC_APP_URL=http://localhost:5180</div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
