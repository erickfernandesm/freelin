# Freelin

Marketplace de oportunidades entre freelancers e contratantes, começando por Juiz de Fora - MG.

> **A plataforma conecta. O contratante decide.**
> Função e experiência enriquecem o perfil, mas nunca escondem uma oportunidade nem impedem a candidatura.

Arquitetura, regras de negócio, conflitos resolvidos e rotas: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 6 · autenticação própria (PBKDF2 + JWT em cookie httpOnly) · deploy na Cloudflare via OpenNext.

## Rodar no seu computador

Pré-requisitos: **Node 22.18+** e **PostgreSQL 14+** (local, Docker ou um banco grátis no [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env          # ajuste DATABASE_URL, DIRECT_URL e AUTH_SECRET
npx prisma migrate dev --name init
npm run db:seed               # cidades, funções, cursos e contas de demonstração
npm run dev                   # http://localhost:3000
```

Postgres rápido com Docker:

```bash
docker run -d --name freelin-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=freelin -p 5432:5432 postgres:16
```

### Contas de demonstração (senha `freelin123`)

| E-mail | Perfil |
|---|---|
| `maria@freelin.app` | Freelancer com experiência e histórico (1 trabalho concluído, avaliada) |
| `joao@freelin.app` | Freelancer **sem experiência** — vê e se candidata a tudo da região |
| `carlos@freelin.app` | Freelancer de Santos Dumont, deslocamento até 50 km |
| `bar@freelin.app` | Contratante (Bar Estação Central) |
| `buffet@freelin.app` | Contratante (Buffet Villa Mariano) |
| `admin@freelin.app` | Administrador |

### Roteiro para testar o fluxo principal

1. Entre como `joao@` → Oportunidades → abra "Bartenders para show de sábado" → **Tenho interesse**.
2. Saia e entre como `bar@` → Painel → a oportunidade mostra 1 candidato novo → abra e **Selecionar**.
3. Volte como `joao@` → Avisos ("Você foi selecionado") → Trabalhos.
4. Como `bar@` → Contratações → **Marcar trabalho como concluído**.
5. Como `joao@` → Trabalhos → **Confirmar trabalho concluído** → avalie o bar.
6. Como `bar@` → Contratações → avalie o João. O perfil dele passa a mostrar 1 trabalho realizado e a nota.

### Testes

```bash
npm run test:domain   # regras de negócio puras (região, agenda, transições, avaliações)
npm run typecheck
```

## Subir no GitHub

```bash
git remote add origin https://github.com/SEU-USUARIO/freelin.git
git push -u origin main
```

## Deploy na Cloudflare (Workers + OpenNext)

1. **Banco:** Postgres no [Neon](https://neon.tech), região São Paulo. O cliente detecta URLs `*.neon.tech` e usa o driver serverless (`@prisma/adapter-neon`), compatível com o runtime da Cloudflare.
2. **Estrutura e dados iniciais:** `npx prisma migrate deploy` e `npm run db:seed` com a `DATABASE_URL` do Neon, ou rode o SQL de `prisma/migrations/0001_init/migration.sql` no SQL Editor do Neon.
3. **Projeto na Cloudflare:** Workers & Pages → Create → Import a repository → este repositório.
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Variáveis (build e runtime): `DATABASE_URL`, `AUTH_SECRET`
4. Pela linha de comando, como alternativa: `npx wrangler secret put DATABASE_URL`, `npx wrangler secret put AUTH_SECRET` e `npm run cf:deploy`.

## Estrutura

```
src/
  app/            telas (rotas)
  actions/        server actions: sessão + validação → serviço
  components/     interface
  lib/            formatação, constantes, schemas zod
  server/
    domain/       regras puras e testadas (sem banco)
    services/     casos de uso + Prisma
    auth/         senha, sessão, guards
    notifications/  disparo multicanal (in-app hoje)
prisma/           schema e seed
docs/             arquitetura e regras
```

## Marca

Logos em `public/brand/`: `wordmark.png` (fundo claro, "Free" em azul-marinho), `wordmark-white.png` (fundos azuis), `wordmark-on-blue.png` (original), `icon*.png` (ícone do app). Cores: azul `#2C67E8` e branco `#FFFFFF`; o azul-marinho `#0F1B3D` é a cor de texto.
