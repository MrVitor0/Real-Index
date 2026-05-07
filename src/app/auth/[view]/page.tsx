import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import {
  AuthScreen,
  isSupportedAuthView,
} from "@/features/auth/components/auth-screen";

export const dynamic = "force-dynamic";

type AuthRoutePageProps = {
  params: Promise<{
    view: string;
  }>;
};

const authRouteMetadata = {
  "sign-in": {
    title: "Entrar",
    description:
      "Acesse sua conta para acompanhar forecasts, rankings e sinais da comunidade.",
    canonical: "/login",
  },
  "sign-up": {
    title: "Criar conta",
    description:
      "Crie sua conta para participar do ranking da comunidade com REAL Credits virtuais.",
    canonical: "/cadastro",
  },
  "forgot-password": {
    title: "Recuperar senha",
    description: "Recupere o acesso a sua conta de forma segura.",
    canonical: "/auth/forgot-password",
  },
  "reset-password": {
    title: "Redefinir senha",
    description: "Defina uma nova senha para voltar ao seu painel privado.",
    canonical: "/auth/reset-password",
  },
} as const;

export async function generateMetadata({
  params,
}: AuthRoutePageProps): Promise<Metadata> {
  const { view } = await params;

  if (!isSupportedAuthView(view)) {
    return {
      title: "Autenticacao",
      description: `Gerencie o acesso a sua conta em ${siteConfig.shortName}.`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const metadata = authRouteMetadata[view];

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.canonical,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `${metadata.title} | ${siteConfig.shortName}`,
      description: metadata.description,
      url: metadata.canonical,
    },
  };
}

export default async function AuthRoutePage({ params }: AuthRoutePageProps) {
  const { view } = await params;

  if (!isSupportedAuthView(view)) {
    notFound();
  }

  return <AuthScreen view={view} />;
}
