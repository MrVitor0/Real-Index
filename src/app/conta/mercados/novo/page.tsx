import { redirect } from "next/navigation";

import { AppNavbar } from "@/components/navigation/app-navbar";
import { CreateMarketForm } from "@/features/markets/components/create-market-form";
import { getServerSession } from "@/lib/auth/server";
import { getEnvironmentStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function NovoMercadoPage() {
  const environment = getEnvironmentStatus();

  if (!environment.hasNeonAuth) {
    redirect("/login");
  }

  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login?next=%2Fconta%2Fmercados%2Fnovo");
  }

  return (
    <>
      <AppNavbar />
      <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
              Criacao autenticada
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Criar um novo mercado de previsao.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-white/56 md:text-base">
              Esse fluxo grava o item no banco, publica na home, habilita a rota
              propria do radar e deixa o mercado pronto para receber snapshots
              reais quando entrarmos na fase de compra e venda.
            </p>
          </div>

          <CreateMarketForm />
        </div>
      </main>
    </>
  );
}
