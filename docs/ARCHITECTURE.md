# Freelin: arquitetura e regras de negócio

> **A plataforma conecta. O contratante decide.**
> Função, experiência, habilidades e histórico enriquecem o perfil: nunca bloqueiam ver ou se candidatar a uma oportunidade.

## 1. Conflitos encontrados na especificação e como foram resolvidos

| # | Conflito | Decisão |
|---|----------|---------|
| 1 | "Somente minha cidade" × escolher várias cidades | Renomeado para **"Somente minhas cidades"**. Cidades escolhidas sempre valem; o deslocamento (20 km, 50 km, qualquer) **amplia** o alcance a partir da cidade principal. |
| 2 | Distribuir por data/disponibilidade × não impedir candidatura por divergência | Disponibilidade **só ordena e sinaliza** ("Combina com sua agenda", "Fora da sua agenda"). Único critério de data que remove do feed é objetivo: a oportunidade já passou. |
| 3 | Freelancer sem região configurada | Não fica sem oportunidades: vê todas, com convite para configurar regiões. |
| 4 | Região limita o feed × não limitar excessivamente | Região define o que aparece no **feed e nas notificações**. Quem recebe um link direto pode ver e se candidatar (com aviso "fora das suas regiões"). |
| 5 | Entidades `Contract` e `Work` separadas | Unificadas em **`Contract`** (contratação = trabalho). "Trabalho concluído" é `Contract.status = COMPLETED`, que exige **as duas partes**: contratante marca, freelancer confirma. A cadeia Oportunidade → Candidatura → Contratação → Avaliação fica intacta, com menos joins. |
| 6 | Status "Trabalho concluído" na candidatura × contratação | A contratação é a fonte da verdade; a candidatura espelha `COMPLETED` quando o trabalho é confirmado. |
| 7 | `Company` e `Admin` como entidades | `ContractorProfile` cobre empresa ou pessoa (`kind`). Admin é `User.role = ADMIN`. Ambas podem virar entidades próprias sem migração dolorosa. |
| 8 | Vagas preenchidas | Ao selecionar o último profissional, a oportunidade vira `FILLED` e para de receber novas candidaturas (critério objetivo). As candidaturas existentes **não** são recusadas automaticamente: quem decide é o contratante. Cancelar uma contratação reabre a vaga. |
| 9 | Recorrente/fixo × "trabalho concluído" | No MVP, uma contratação por profissional cobre o vínculo inteiro e é concluída ao fim dele. A modelagem permite evoluir para turnos individuais (`ContractShift`). |
| 10 | Freelancer discorda da conclusão | Pode **contestar** ("Ainda não foi realizado"), e a contratação volta para "em andamento". Nenhuma das partes conclui sozinha. |
| 12 | Contratante quer limitar por localização | Campo opcional "quem pode ver": só quem mora na cidade ou num raio (10, 20, 50 km) do local. É critério objetivo de localização; as duas pontas (freelancer e contratante) precisam concordar. |
| 11 | Número de trabalhos informado manualmente | Impossível: contagem e nota são **sempre calculadas** a partir de contratações concluídas e avaliações vinculadas. |

## 2. Arquitetura

```
src/
├─ app/                  Rotas (Next.js App Router): só composição de tela
│  ├─ (public)/          Landing, entrar, cadastro
│  ├─ (app)/             Área logada (freelancer, contratante, compartilhado)
│  └─ admin/             Painel administrativo
├─ actions/              Server Actions: autenticam, validam (zod) e chamam serviços
├─ components/           UI (ui/ = primitivos; demais = componentes de produto)
├─ lib/                  Formatação, validação (schemas zod), utilitários de cliente
└─ server/
   ├─ domain/            Regras puras, sem banco nem framework (testadas)
   ├─ services/          Casos de uso + acesso a dados (Prisma), transações
   ├─ auth/              Senha (PBKDF2/Web Crypto), sessão (JWT httpOnly), guards
   ├─ notifications/     Disparo multicanal (in-app hoje; push/e-mail/WhatsApp depois)
   └─ db.ts              Cliente Prisma
```

**Fluxo de uma ação:** componente → server action (sessão + zod) → serviço (regra + transação) → domínio (decisão pura) → Prisma.

Componentes nunca decidem regra de negócio. Serviços nunca leem `FormData`. O domínio não importa Prisma, por isso roda em teste sem banco.

### Stack
- Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL + Prisma 6
- Autenticação própria: senha com PBKDF2 (Web Crypto, 210k iterações), sessão em JWT assinado (`jose`) em cookie httpOnly/SameSite=Lax; status do usuário revalidado no banco a cada requisição (bloqueio vale na hora)
- Compatível com Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`) + Postgres gerenciado (Neon/Supabase) por driver adapter

## 3. Modelo de dados

```
User ─┬─ FreelancerProfile ─┬─ FreelancerCity ── City ── Region
      │                     ├─ FreelancerRole ── Role
      │                     ├─ Availability
      │                     └─ Application ──┐
      ├─ ContractorProfile ── Opportunity ───┘ (1:N)
      │                                      │
      │            Application ── Contract (1:1) ── Review (1 por direção)
      ├─ Notification
      └─ Review (autor / alvo)
Course ── Role (opcional)
```

Garantias no banco:
- `Application @@unique([opportunityId, freelancerId])`: uma candidatura por pessoa
- `Contract.applicationId @unique`: contratação nasce de uma candidatura
- `Review @@unique([contractId, direction])`: uma avaliação por lado por trabalho
- Valores em centavos (`Int`), datas de calendário em `@db.Date`, horários `HH:MM` (término < início = atravessa a meia-noite)

## 4. Distribuição de oportunidades (feed)

1. Status `OPEN` e ainda vigente (data não passou).
2. Cidade da oportunidade dentro do alcance do freelancer (cidades escolhidas, cidade onde mora e cidades no raio de deslocamento; "qualquer distância" = todas) e freelancer dentro do alcance definido pelo contratante, quando houver.
3. Filtros que **o próprio freelancer** escolhe na tela (cidade, data, valor, tipo, urgente, função e "Só as que combinam comigo"): preferência de navegação, não restrição.
4. Ordenação: urgentes primeiro → compatibilidade (agenda, cidade principal, proximidade da data) → data.

Nada disso olha função, experiência, habilidades, nota ou histórico.

## 5. Ciclo de vida

**Candidatura:** Enviada → Visualizada (contratante abriu) → Em análise → Selecionado / Recusado. Freelancer pode cancelar enquanto não há decisão. Selecionado → Trabalho concluído.

**Contratação:** Em andamento → (contratante marca concluído) Aguardando confirmação → (freelancer confirma) Concluída. Freelancer pode contestar; qualquer parte pode cancelar enquanto em andamento (vaga reabre).

**Avaliação:** liberada apenas para contratação concluída, uma por lado, critérios fixos por direção.

## 6. Rotas

### Público
| Rota | Tela |
|---|---|
| `/` | Landing |
| `/entrar`, `/cadastro` | Autenticação (cadastro escolhe Freelancer ou Contratante) |
| `/boas-vindas` | Onboarding em etapas |

### Freelancer
| Rota | Tela |
|---|---|
| `/oportunidades` | Feed com filtros |
| `/oportunidades/[id]` | Detalhe + "Tenho interesse" |
| `/candidaturas` | Minhas candidaturas e status |
| `/trabalhos` | Em andamento, aguardando confirmação, concluídos, avaliar |
| `/perfil`, `/perfil/editar` | Perfil profissional, regiões, deslocamento, agenda |

### Contratante
| Rota | Tela |
|---|---|
| `/painel` | Resumo: vagas abertas, candidatos novos, contratações |
| `/vagas/nova` | Publicar oportunidade |
| `/vagas/[id]` | Gerenciar oportunidade e candidatos |
| `/contratacoes` | Acompanhar, concluir, avaliar, histórico |
| `/empresa/editar` | Perfil do contratante |

### Compartilhado
| Rota | Tela |
|---|---|
| `/profissional/[id]` | Perfil público do freelancer (reputação real) |
| `/contratante/[id]` | Perfil público do contratante |
| `/avisos` | Notificações |
| `/cursos` | Cursos: explorar por área, meus cursos (progresso) e meus diplomas |
| `/cursos/[id]` | Página do curso: grade, preço, inscrição, progresso |
| `/cursos/[id]/aula/[aula]` | Aula: vídeo, descrição, concluir e seguir |

### Certificado (público)
| Rota | Tela |
|---|---|
| `/certificado/[código]` | Certificado verificável, pronto para imprimir ou salvar em PDF |

### Admin (`/admin`)
Métricas; usuários (detalhe completo, edição de dados e senha, bloquear, tornar admin, excluir); oportunidades (moderar); atividade (ocultar avaliação); suporte (conversas do botão flutuante); cursos (módulos, aulas, cobrança, inscrições); funções e cidades.

### Cursos da plataforma
- `Course` → `CourseModule` → `Lesson`; `Enrollment` liga pessoa e curso; `LessonProgress` marca aula concluída.
- Cobrança: grátis, pagamento único, mensal ou anual. Grátis libera na hora; pago vira pedido (`PENDING`) e o admin libera após confirmar o pagamento. Assinatura guarda `expiresAt` e é renovada pelo admin.
- Concluir a última aula grava `completedAt` e um código de certificado; o curso vira diploma e troféu no perfil do freelancer.
- Regras puras em `src/server/domain/courses.ts` (acesso, validade, progresso, código), cobertas por testes.
- Curso com `url` é vitrine de parceiro (link externo, sem aulas).

### Suporte
- Botão flutuante na página inicial e no app (`SupportWidget`), conversa única por pessoa.
- Com conta: identificada pela sessão; a resposta também chega como notificação e o link reabre o suporte (`?suporte=1`).
- Visitante: informa nome e contato na primeira mensagem; o navegador guarda um cookie aleatório (no banco fica só o hash sha256).
- `GET/POST /api/suporte` para o widget; resposta, encerrar e reabrir pelo admin em `/admin/suporte` (server actions).
- Limite de 15 mensagens a cada 5 minutos por conversa, para conter abuso.

### API
Mutações são **Server Actions** em `src/actions/*` (tipadas, com CSRF nativo do Next). `GET /api/health` para monitoramento. Os serviços em `src/server/services` são a API interna e podem ser expostos como REST (app nativo, integrações) sem reescrever regra.

## 7. Preparado para evoluir
- **Expansão:** a base tem todos os 5.570 municípios do IBGE com coordenadas; nada é fixo em Juiz de Fora. O admin ativa ou desativa cidades.
- **Banco no deploy:** `npm run build` aplica migrações pendentes e sincroniza o catálogo (`scripts/db-setup.mjs`).
- **Geolocalização:** `City.lat/lng` + haversine hoje; trocar por coordenadas do endereço/PostGIS sem mudar o contrato do domínio.
- **Notificações:** `notify()` recebe canais; in-app implementado, push/e-mail/WhatsApp entram como novos canais.
- **Fotos:** hoje redimensionadas no navegador e salvas inline; `storage` pode apontar para Cloudflare R2.
- **Monetização:** destaque de vaga e planos entram como novas tabelas, sem tocar no fluxo central.
- **Pagamento de cursos:** hoje o admin libera o acesso manualmente; um checkout (Pix/cartão) só precisa ativar a `Enrollment` pelo webhook, usando `adminActivateEnrollment`.
