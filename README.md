# REAL Severity Index

> Comunidade gamificada de forecasting para acompanhar lançamentos, incidentes e sinais em tecnologia.

O REAL Severity Index transforma sinais da comunidade em forecasts gamificados sobre lançamentos, incidentes, open source, IA e infraestrutura. A experiência usa **REAL Credits virtuais** para reputação e ranking — sem saque, sem depósito, sem compra de moeda e sem recompensa financeira de qualquer natureza.

Projeto open source feito pela e para a comunidade dev brasileira. 🇧🇷

---

## Stack

| Camada             | Tecnologia                  |
| ------------------ | --------------------------- |
| Framework          | Next.js 16 + App Router     |
| Linguagem          | TypeScript (strict)         |
| Estilo             | Tailwind CSS v4 + shadcn/ui |
| Banco de dados     | Neon PostgreSQL             |
| ORM                | Drizzle ORM                 |
| Cache / Rate limit | Upstash Redis               |
| Autenticação       | Neon Auth                   |

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta no [Neon](https://neon.tech) (banco + auth)
- Conta no [Upstash](https://upstash.com) (Redis)

---

## Setup local

```bash
# 1. Clone o repositório
git clone https://github.com/MrVitor0/REAL-Severity-Index.git
cd REAL-Severity-Index

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais Neon e Upstash

# 4. Sincronize o schema no banco
npm run db:push

# 5. Suba o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:5180
```

### Configurando o Neon Auth

1. Habilite Auth no Neon Console e copie a URL para `NEON_AUTH_BASE_URL`.
2. Gere o cookie secret:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```
3. Login com Google pode ser habilitado direto no Neon Auth com credenciais de desenvolvimento compartilhadas.

---

## Scripts disponíveis

| Comando               | Descrição                                |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento (porta 5180) |
| `npm run build`       | Build de produção                        |
| `npm run start`       | Inicia o build de produção               |
| `npm run check`       | Lint + typecheck                         |
| `npm run lint`        | ESLint                                   |
| `npm run typecheck`   | TypeScript sem emitir arquivos           |
| `npm run test:unit`   | Testes unitários com Vitest              |
| `npm run db:generate` | Gera as migrations a partir do schema    |
| `npm run db:push`     | Aplica o schema direto no banco (dev)    |
| `npm run db:migrate`  | Executa as migrations geradas            |
| `npm run db:studio`   | Abre o Drizzle Studio                    |

Antes de abrir PR, rode sempre:

```bash
npm run check
npm run test:unit
```

---

## Estrutura do projeto

```
src/
├── app/            # Rotas, layouts, API routes e metadata
├── components/     # Componentes de UI reutilizáveis (shadcn + branding)
├── config/         # Configurações estáticas (site, env)
├── features/       # Módulos por domínio (account, home, marketplace, etc.)
├── lib/            # Utilitários transversais e auth client/server
└── server/         # Lógica de servidor: DB, Redis, services e testes
```

Cada feature em `src/features/` segue a estrutura:

```
features/<domínio>/
├── components/   # Componentes React do domínio
├── contracts/    # Tipos, schemas e interfaces públicas
├── hooks/        # React hooks do domínio
└── lib/          # Lógica pura e serviços do domínio
```

---

## Contribuindo

Contribuições são bem-vindas! Leia as diretrizes abaixo antes de abrir um PR.

### Fluxo de contribuição

1. **Fork** o repositório e crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-feature
   ```
2. Faça suas alterações seguindo as convenções do projeto.
3. Rode `npm run check` e `npm run test:unit` e garanta que passam.
4. Commit com mensagens descritivas usando [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: adiciona sistema de badges
   fix: corrige cálculo de XP no ranking
   chore: atualiza dependências
   ```
5. Abra um **Pull Request** para `main` descrevendo o que foi feito e por quê.

### Diretrizes de código

- Siga o estilo existente: TypeScript strict, sem `any`, sem variáveis não utilizadas.
- Prefira **Server Components** e use Client Components apenas quando houver interatividade real no cliente.
- Novos endpoints em Route Handlers e Server Actions devem incluir validação de entrada e proteção de rate limit.
- Extraia lógica de negócio para `lib/` ou `server/`, mantendo componentes focados em UI.
- Não exponha segredos, tokens, dados pessoais ou informações sensíveis em nenhum arquivo do repositório.
- REAL Credits são **virtuais** — nenhum código deve implicar valor financeiro real.

### Reportando bugs e sugerindo features

- Abra uma [Issue](https://github.com/MrVitor0/REAL-Severity-Index/issues) descrevendo o problema ou a ideia.
- Para bugs, inclua: comportamento esperado, comportamento atual, passos para reproduzir e ambiente (OS, Node.js, browser).

### O que não aceitar em PRs

- Dados reais de usuários, seeds com PII ou fixtures com informação sensível.
- Chaves de API, tokens ou secrets hardcoded.
- Código que implique mecânica financeira real (saque, compra, payout).
- Alterações de escopo sem discussão prévia em issue.

---

## Missão

A comunidade dev brasileira unida para preservar a estabilidade tecnológica nacional. 🇧🇷⚠️

> Vídeo do Lucas Montano pra motivar vocês a codar: https://www.youtube.com/watch?v=T9V7EyB_B9w
