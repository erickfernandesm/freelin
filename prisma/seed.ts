/**
 * Dados iniciais: cidades da região de Juiz de Fora, funções, cursos
 * e contas de demonstração. Rodar com: npm run db:seed
 * Senha de todas as contas demo: freelin123
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password.ts";

const db = new PrismaClient();

// Catálogo completo: municípios do IBGE e funções (mesmos dados do deploy)
const CITIES: Array<[string, string, number, number]> = JSON.parse(
  readFileSync(new URL("./data/cidades.json", import.meta.url), "utf8"),
);
const ROLES: Array<[string, string]> = JSON.parse(readFileSync(new URL("./data/funcoes.json", import.meta.url), "utf8"));

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function daysFromNow(n: number) {
  const d = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
  const base = new Date(`${iso}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + n);
  return base;
}

async function main() {
  const region = await db.region.upsert({
    where: { name: "Zona da Mata" },
    update: {},
    create: { name: "Zona da Mata", state: "MG" },
  });

  const rows = CITIES.map(([name, state, lat, lng]) => ({
    name,
    state,
    lat,
    lng,
    slug: slugify(`${name}-${state}`),
    search: normalize(name),
    regionId: state === "MG" ? region.id : null,
  }));
  for (let i = 0; i < rows.length; i += 1000) {
    await db.city.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
  }
  const cityIds: Record<string, string> = {};
  for (const c of await db.city.findMany({ where: { state: "MG" }, select: { id: true, name: true } })) cityIds[c.name] = c.id;

  const roleIds: Record<string, string> = {};
  for (const [i, [name, emoji]] of ROLES.entries()) {
    const role = await db.role.upsert({
      where: { slug: slugify(name) },
      update: { emoji, sortOrder: i },
      create: { name, slug: slugify(name), emoji, sortOrder: i },
    });
    roleIds[name] = role.id;
  }

  // Curso de demonstração da plataforma (local): módulos e aulas sem vídeo
  if ((await db.course.count()) === 0) {
    await db.course.create({
      data: {
        title: "Garçom de eventos: do zero ao primeiro trabalho",
        provider: "Equipe Freelin",
        description: "Postura, serviço à francesa e o que esperar no primeiro evento. Curso curto e prático.",
        emoji: "🍽️",
        roleId: roleIds["Garçom"],
        billing: "FREE",
        workloadHours: 2,
        featured: true,
        modules: {
          create: [
            {
              title: "Antes do evento",
              position: 1,
              lessons: {
                create: [
                  { title: "Como se apresentar", position: 1, durationMin: 8, description: "Roupa, horário de chegada e o que levar." },
                  { title: "Entendendo o briefing", position: 2, durationMin: 10, description: "Perguntas para fazer ao contratante." },
                ],
              },
            },
            {
              title: "Durante o serviço",
              position: 2,
              lessons: {
                create: [
                  { title: "Serviço à francesa", position: 1, durationMin: 15 },
                  { title: "Postura e atendimento", position: 2, durationMin: 12 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // ───── Contas de demonstração ─────
  const passwordHash = await hashPassword("freelin123");

  await db.user.upsert({
    where: { email: "admin@freelin.app" },
    update: {},
    create: { email: "admin@freelin.app", name: "Admin Freelin", role: "ADMIN", passwordHash, onboardedAt: new Date() },
  });

  const contractor = await db.user.upsert({
    where: { email: "bar@freelin.app" },
    update: {},
    create: {
      email: "bar@freelin.app",
      name: "Rafael Costa",
      role: "CONTRACTOR",
      passwordHash,
      onboardedAt: new Date(),
      contractor: {
        create: {
          displayName: "Bar Estação Central",
          kind: "COMPANY",
          segment: "Bar",
          description: "Bar e casa de shows no centro de Juiz de Fora. Eventos às sextas e sábados.",
          cityId: cityIds["Juiz de Fora"],
          contactPhone: "(32) 99999-0000",
          instagram: "estacaocentraljf",
        },
      },
    },
    include: { contractor: true },
  });

  const buffet = await db.user.upsert({
    where: { email: "buffet@freelin.app" },
    update: {},
    create: {
      email: "buffet@freelin.app",
      name: "Ana Lima",
      role: "CONTRACTOR",
      passwordHash,
      onboardedAt: new Date(),
      contractor: {
        create: {
          displayName: "Buffet Villa Mariano",
          kind: "COMPANY",
          segment: "Buffet",
          description: "Casamentos, formaturas e eventos corporativos desde 2009.",
          cityId: cityIds["Juiz de Fora"],
        },
      },
    },
    include: { contractor: true },
  });

  const freelancers = [
    {
      email: "maria@freelin.app",
      name: "Maria Souza",
      headline: "Bartender e atendimento em eventos",
      bio: "Trabalho com eventos há dois anos. Gosto de bar movimentado e de cuidar bem do cliente.",
      main: "Juiz de Fora",
      extra: ["Matias Barbosa"],
      travel: "KM_20" as const,
      roles: ["Bartender", "Garçom"],
      level: "PROFESSIONAL" as const,
      years: 2,
      skills: ["Drinks clássicos", "Caipirinhas", "Atendimento"],
    },
    {
      email: "joao@freelin.app",
      name: "João Silva",
      headline: "Buscando minha primeira oportunidade",
      bio: "Sou pontual, aprendo rápido e tenho disponibilidade nos fins de semana.",
      main: "Juiz de Fora",
      extra: [],
      travel: "CHOSEN_CITIES" as const,
      roles: [],
      level: "NONE" as const,
      years: null,
      skills: [],
    },
    {
      email: "carlos@freelin.app",
      name: "Carlos Oliveira",
      headline: "Garçom",
      bio: "Um ano de experiência em restaurante e eventos.",
      main: "Santos Dumont",
      extra: ["Juiz de Fora"],
      travel: "KM_50" as const,
      roles: ["Garçom", "Copeiro"],
      level: "PROFESSIONAL" as const,
      years: 1,
      skills: ["Serviço à francesa"],
    },
  ];

  const freelancerProfiles: Record<string, { id: string; userId: string }> = {};
  for (const f of freelancers) {
    const user = await db.user.upsert({
      where: { email: f.email },
      update: {},
      create: {
        email: f.email,
        name: f.name,
        role: "FREELANCER",
        passwordHash,
        onboardedAt: new Date(),
        freelancer: {
          create: {
            headline: f.headline,
            bio: f.bio,
            mainCityId: cityIds[f.main],
            travelPreference: f.travel,
            experienceLevel: f.level,
            experienceYears: f.years,
            skills: f.skills,
            workCities: { create: [f.main, ...f.extra].map((c) => ({ cityId: cityIds[c] })) },
            roles: { create: f.roles.map((r) => ({ roleId: roleIds[r] })) },
            availability: {
              create: [
                { weekday: 5, startTime: "18:00", endTime: "02:00" },
                { weekday: 6, startTime: "18:00", endTime: "03:00" },
                { weekday: 0, startTime: "14:00", endTime: "22:00" },
              ],
            },
          },
        },
      },
      include: { freelancer: true },
    });
    freelancerProfiles[f.email] = { id: user.freelancer!.id, userId: user.id };
  }

  if ((await db.opportunity.count()) === 0) {
    const c1 = contractor.contractor!.id;
    const c2 = buffet.contractor!.id;
    await db.opportunity.createMany({
      data: [
        {
          contractorId: c1,
          title: "Preciso de um garçom hoje",
          roleId: roleIds["Garçom"],
          slots: 1,
          cityId: cityIds["Juiz de Fora"],
          address: "Rua Halfeld, 1000, Centro",
          type: "SINGLE",
          startDate: daysFromNow(0),
          startTime: "18:00",
          endTime: "00:00",
          payCents: 12000,
          description: "Um garçom faltou e precisamos de reforço para o movimento de hoje à noite.",
          urgent: true,
        },
        {
          contractorId: c1,
          title: "Bartenders para show de sábado",
          roleId: roleIds["Bartender"],
          slots: 3,
          cityId: cityIds["Juiz de Fora"],
          address: "Rua Halfeld, 1000, Centro",
          type: "SINGLE",
          startDate: daysFromNow(3),
          startTime: "20:00",
          endTime: "03:00",
          payCents: 18000,
          paymentMethod: "Pix no fim do turno",
          description: "Show com casa cheia. Drinks simples e cerveja. Treinamos quem ainda não tem experiência.",
          requirements: "Roupa preta. Chegar 30 min antes.",
        },
        {
          contractorId: c2,
          title: "Garçons para casamento",
          roleId: roleIds["Garçom"],
          slots: 6,
          cityId: cityIds["Matias Barbosa"],
          address: "Sítio Recanto Verde",
          type: "SINGLE",
          startDate: daysFromNow(10),
          startTime: "17:00",
          endTime: "01:00",
          payCents: 15000,
          description: "Casamento para 250 convidados. Transporte saindo do centro de Juiz de Fora.",
        },
        {
          contractorId: c2,
          title: "Auxiliar de cozinha, fins de semana",
          roleId: roleIds["Auxiliar de cozinha"],
          slots: 2,
          cityId: cityIds["Juiz de Fora"],
          type: "RECURRING",
          recurrenceDays: [5, 6],
          startTime: "14:00",
          endTime: "23:00",
          payCents: 14000,
          description: "Apoio na produção de buffet às sextas e sábados.",
        },
        {
          contractorId: c2,
          title: "Recepcionista para temporada de formaturas",
          roleId: roleIds["Recepcionista"],
          slots: 2,
          cityId: cityIds["Juiz de Fora"],
          type: "TEMPORARY",
          startDate: daysFromNow(20),
          endDate: daysFromNow(50),
          recurrenceDays: [5, 6],
          startTime: "18:00",
          endTime: "00:00",
          payCents: 13000,
          description: "Recepção de convidados e controle de lista nas formaturas de fim de ano.",
        },
        {
          contractorId: c1,
          title: "Garçom fixo para o salão",
          roleId: roleIds["Garçom"],
          slots: 1,
          cityId: cityIds["Juiz de Fora"],
          type: "FIXED",
          recurrenceDays: [3, 4, 5, 6],
          startTime: "18:00",
          endTime: "01:00",
          payCents: 220000,
          payUnit: "MONTH",
          description: "Vaga contínua de quarta a sábado à noite.",
        },
        {
          contractorId: c2,
          title: "Copeiros para evento corporativo",
          roleId: roleIds["Copeiro"],
          slots: 2,
          cityId: cityIds["Santos Dumont"],
          type: "SINGLE",
          startDate: daysFromNow(6),
          startTime: "08:00",
          endTime: "16:00",
          payCents: 13000,
          description: "Café da manhã e almoço para convenção de empresa.",
        },
      ],
    });

    // Histórico real para a Maria: trabalho concluído + avaliações nos dois sentidos
    const maria = freelancerProfiles["maria@freelin.app"];
    const past = await db.opportunity.create({
      data: {
        contractorId: c1,
        title: "Bartender para festa de aniversário",
        roleId: roleIds["Bartender"],
        slots: 1,
        cityId: cityIds["Juiz de Fora"],
        type: "SINGLE",
        startDate: daysFromNow(-12),
        startTime: "20:00",
        endTime: "02:00",
        payCents: 16000,
        description: "Festa particular para 80 pessoas.",
        status: "FILLED",
      },
    });
    const app = await db.application.create({
      data: { opportunityId: past.id, freelancerId: maria.id, status: "COMPLETED" },
    });
    const contract = await db.contract.create({
      data: {
        applicationId: app.id,
        opportunityId: past.id,
        freelancerId: maria.id,
        contractorId: c1,
        status: "COMPLETED",
        agreedPayCents: 16000,
        workDate: past.startDate,
        startTime: "20:00",
        endTime: "02:00",
        contractorMarkedAt: daysFromNow(-11),
        freelancerConfirmedAt: daysFromNow(-11),
        completedAt: daysFromNow(-11),
      },
    });
    await db.review.createMany({
      data: [
        {
          contractId: contract.id,
          direction: "CONTRACTOR_TO_FREELANCER",
          authorId: contractor.id,
          targetId: maria.userId,
          overall: 5,
          criteria: { punctuality: 5, professionalism: 5, communication: 5, quality: 5 },
          comment: "Excelente! Rápida, simpática e organizada no bar.",
        },
        {
          contractId: contract.id,
          direction: "FREELANCER_TO_CONTRACTOR",
          authorId: maria.userId,
          targetId: contractor.id,
          overall: 5,
          criteria: { payment: 5, organization: 4, communication: 5, respect: 5 },
          comment: "Pagamento na hora e equipe muito respeitosa.",
        },
      ],
    });
  }

  console.log("✔ Seed concluído. Contas demo (senha freelin123):");
  console.log("  admin@freelin.app · bar@freelin.app · buffet@freelin.app · maria@freelin.app · joao@freelin.app · carlos@freelin.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
