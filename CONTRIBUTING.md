# Guia de Contribuição

Obrigado pelo interesse em contribuir com o REAL Severity Index! Este documento descreve o processo completo para contribuir com código, reportar bugs ou sugerir melhorias.

---

## Antes de começar

- Leia o [README](./README.md) para entender o projeto, o stack e como rodar localmente.
- Verifique as [Issues abertas](https://github.com/MrVitor0/REAL-Severity-Index/issues) para não duplicar trabalho.
- Para mudanças grandes, abra uma issue **antes** de começar a implementar, para alinhar a direção com os mantenedores.

---

## Ambiente de desenvolvimento

### Pré-requisitos

- Node.js 20+
- npm 10+
- Conta no [Neon](https://neon.tech) (banco + auth)
- Conta no [Upstash](https://upstash.com) (Redis)

### Setup

```bash
git clone https://github.com/MrVitor0/REAL-Severity-Index.git
cd REAL-Severity-Index
npm install
cp .env.example .env
# Preencha o .env com suas credenciais
npm run db:push
npm run dev
```

---

## Fluxo de contribuição

1. **Fork** o repositório no GitHub.
2. **Clone** seu fork localmente:
   ```bash
   git clone https://github.com/<seu-usuario>/REAL-Severity-Index.git
   ```
3. **Crie uma branch** a partir de `main` com nome descritivo:
   ```bash
   git checkout -b feat/nome-da-feature
   # ou
   git checkout -b fix/descricao-do-bug
   ```
4. **Implemente** suas alterações seguindo as diretrizes abaixo.
5. **Valide** antes de commitar:
   ```bash
   npm run check      # lint + typecheck
   npm run test:unit  # testes unitários
   ```
6. **Commit** com [Conventional Commits](https://www.conventionalcommits.org/):

   | Prefixo     | Quando usar                              |
   | ----------- | ---------------------------------------- |
   | `feat:`     | Nova funcionalidade                      |
   | `fix:`      | Correção de bug                          |
   | `chore:`    | Manutenção, dependências, config         |
   | `docs:`     | Documentação                             |
   | `refactor:` | Refatoração sem mudança de comportamento |
   | `test:`     | Adição ou correção de testes             |
   | `perf:`     | Melhoria de performance                  |

   Exemplo:

   ```
   feat: adiciona sistema de badges por streak diário
   fix: corrige cálculo de XP no ranking semanal
   ```

7. **Push** e abra um **Pull Request** para `main` no repositório original.

---

## Diretrizes de código

### TypeScript

- TypeScript strict — sem `any`, sem `@ts-ignore` sem justificativa.
- Prefira tipos explícitos em contratos e interfaces públicas.
- Não deixe variáveis, imports ou parâmetros não utilizados.

### Next.js / React

- Default: **Server Components**. Use Client Components apenas quando houver interatividade real no cliente (`useState`, `useEffect`, event handlers diretos no DOM).
- Mantenha o boundary cliente-servidor explícito e intencional.
- Não faça fetch client-side quando o mesmo dado pode ser resolvido no servidor.
- Use as features nativas do framework: layouts, loading, error boundaries, metadata, cache.

### Arquitetura

- Lógica de negócio vai em `server/` ou `features/<domínio>/lib/`.
- Componentes devem ser focados em UI; não misture fetch, transformação de dados e renderização no mesmo componente.
- Extraia hooks para `features/<domínio>/hooks/` quando houver estado ou efeitos reutilizáveis.
- Contratos (tipos, schemas, interfaces públicas) ficam em `features/<domínio>/contracts/`.

### Segurança e privacidade

- Nunca exponha segredos, tokens, API keys ou credenciais em nenhum arquivo do repositório.
- Nunca commite dados reais de usuários, seeds com PII ou fixtures com informação sensível.
- Novos endpoints (Route Handlers e Server Actions) devem incluir validação de entrada e proteção de rate limit.
- REAL Credits são **virtuais** — nenhum código deve implicar valor financeiro real (saque, depósito, compra, payout).

### Estilo

- Siga a formatação existente (ESLint + TypeScript já cobrem isso).
- Nomes em inglês para código (variáveis, funções, tipos), português para conteúdo de UI e mensagens de usuário.

---

## Testes

- Testes unitários ficam em `*.test.ts` ao lado do arquivo testado.
- Use [Vitest](https://vitest.dev/) — já configurado no projeto.
- Cubra casos de borda em lógica de negócio crítica (ranking, XP, cálculos de forecast).
- Não é necessário testar componentes de UI para cada PR, mas testes de lógica pura são bem-vindos.

---

## O que não é aceito em PRs

- Dados reais de usuários, seeds com PII ou fixtures com informação sensível.
- Chaves de API, tokens ou secrets hardcoded.
- Código que implique mecânica financeira real.
- Alterações de escopo grandes sem discussão prévia em issue.
- PRs que não passem em `npm run check` e `npm run test:unit`.

---

## Dúvidas

Abra uma [Discussion](https://github.com/MrVitor0/REAL-Severity-Index/discussions) ou comente em uma issue existente.
