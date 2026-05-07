import { siteConfig } from "@/config/site";

export function HomeFooter() {
  return (
    <footer className="border-t border-white/7 bg-black/10">
      <div className="mx-auto flex w-full max-w-375 flex-col gap-4 px-4 py-6 md:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
            Projeto open source
          </p>
          <p className="text-sm leading-6 text-white/68">
            {siteConfig.name} e uma plataforma open source de observabilidade e
            forecasting comunitario com IA e sinais coletivos, criada para
            entretenimento, experimentacao e cultura de internet. Nao e casa de
            apostas, cassino, exchange ou plataforma financeira, e os REAL
            Credits sao 100% virtuais, sem saque, deposito ou conversao em
            dinheiro.
          </p>
        </div>

        <a
          href={siteConfig.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:border-white/18 hover:bg-white/10"
        >
          Visitar repositorio publico e contribuir
        </a>
      </div>
    </footer>
  );
}
