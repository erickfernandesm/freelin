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

1. **Banco:** crie um Postgres no [Neon](https://neon.tech) (região São Paulo). Use a URL *pooled* em `DATABASE_URL` e a direta em `DIRECT_URL`. Rode as migrações a partir do seu computador:
   ```bash
   DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
   DATABASE_URL="..." DIRECT_URL="..." npm run db:seed
   ```
2. **Prisma no Workers:** o runtime da Cloudflare precisa de driver adapter. Instale `npm i @prisma/adapter-neon @neondatabase/serverless`, adicione `previewFeatures = ["driverAdapters"]` ao `generator` em `prisma/schema.prisma` e troque a criação do cliente em `src/server/db.ts` por:
   ```ts
   import { PrismaNeon } from "@prisma/adapter-neon";
   export const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
   ```
   (Rodando em Node — local ou outro host — o cliente padrão funciona sem mudanças.)
3. **Segredos:**
   ```bash
   npx wrangler login
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put AUTH_SECRET
   ```
4. **Publicar:** `npm run cf:deploy`. Para testar localmente no runtime da Cloudflare antes: `npm run cf:preview`.

Também dá para conectar o repositório no painel da Cloudflare (Workers → Create → Import a repository) com o comando de build `npx opennextjs-cloudflare build` e deploy `npx opennextjs-cloudflare deploy`.

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
