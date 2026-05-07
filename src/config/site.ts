export const siteConfig = {
  name: "REAL Severity Index",
  description:
    "Scaffold inicial do MVP com Next.js, Tailwind CSS, shadcn/ui, Neon PostgreSQL, Drizzle ORM e Upstash Redis.",
  tagline:
    "Base pronta para autenticação, perfis públicos, previsões e reputação com uma arquitetura simples e escalável.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  repoUrl: "https://github.com/MrVitor0/REAL-Severity-Index",
  docsUrl: "https://ui.shadcn.com",
} as const;
