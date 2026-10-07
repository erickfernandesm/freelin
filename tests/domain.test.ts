// Testes das regras de negócio puras. Rodar com: npm run test:domain
import { test } from "node:test";
import assert from "node:assert/strict";
import { freelancerReaches, opportunityAccepts, isVisibleTo, isOpportunityCurrent, canApply } from "../src/server/domain/eligibility.ts";
import { evaluateAgendaFit } from "../src/server/domain/availability.ts";
import { rankFeed, matchesMyProfile } from "../src/server/domain/ranking.ts";
import { canMoveApplication, canMoveContract } from "../src/server/domain/transitions.ts";
import { canReview, validateScores, averageRating } from "../src/server/domain/reviews.ts";
import { shiftToRange, shiftHours, todayISO } from "../src/server/domain/time.ts";
import type { AvailabilitySlot, OpportunitySchedule } from "../src/server/domain/types.ts";

const jf = { id: "jf", lat: -21.7642, lng: -43.3503 };
const matias = { id: "matias", lat: -21.869, lng: -43.3186 }; // ~12 km de JF
const santos = { id: "santos", lat: -21.4569, lng: -43.5525 }; // ~40 km de JF
const barbacena = { id: "barbacena", lat: -21.2214, lng: -43.7703 }; // ~75 km de JF

test("cidades escolhidas sempre valem, mesmo em 'somente minhas cidades'", () => {
  const f = { mainCity: jf, workCityIds: ["santos"], travel: "CHOSEN_CITIES" as const };
  assert.ok(freelancerReaches(f, jf));
  assert.ok(freelancerReaches(f, santos));
  assert.ok(!freelancerReaches(f, matias));
});

test("deslocamento amplia alcance a partir da cidade onde mora", () => {
  const f20 = { mainCity: jf, workCityIds: [], travel: "KM_20" as const };
  assert.ok(freelancerReaches(f20, matias));
  assert.ok(!freelancerReaches(f20, santos));
  const f50 = { ...f20, travel: "KM_50" as const };
  assert.ok(freelancerReaches(f50, santos));
  assert.ok(!freelancerReaches(f50, barbacena));
  assert.ok(freelancerReaches({ ...f20, travel: "ANY" as const }, barbacena));
});

test("perfil sem região não fica sem oportunidades", () => {
  assert.ok(freelancerReaches({ mainCity: null, workCityIds: [], travel: "CHOSEN_CITIES" }, barbacena));
});

test("contratante pode limitar a vaga por cidade ou raio do local", () => {
  assert.ok(opportunityAccepts({ city: jf, reachKm: null }, barbacena));
  assert.ok(opportunityAccepts({ city: jf, reachKm: 0 }, jf));
  assert.ok(!opportunityAccepts({ city: jf, reachKm: 0 }, matias));
  assert.ok(opportunityAccepts({ city: jf, reachKm: 20 }, matias));
  assert.ok(!opportunityAccepts({ city: jf, reachKm: 20 }, santos));
  // as duas pontas precisam concordar
  const f = { mainCity: santos, workCityIds: ["jf"], travel: "CHOSEN_CITIES" as const };
  assert.ok(isVisibleTo(f, { city: jf, reachKm: null }));
  assert.ok(!isVisibleTo(f, { city: jf, reachKm: 20 }));
});

const base: OpportunitySchedule & { status: "OPEN" } = {
  status: "OPEN",
  type: "SINGLE",
  startDate: "2026-10-10",
  endDate: null,
  recurrenceDays: [],
  startTime: "18:00",
  endTime: "02:00",
};

test("oportunidade passada sai do feed; futura e recorrente continuam", () => {
  assert.ok(isOpportunityCurrent(base, "2026-10-10"));
  assert.ok(!isOpportunityCurrent(base, "2026-10-11"));
  assert.ok(isOpportunityCurrent({ ...base, type: "FIXED", startDate: null }, "2027-01-01"));
  assert.ok(!isOpportunityCurrent({ ...base, type: "TEMPORARY", startDate: "2026-11-01", endDate: "2026-11-30" }, "2026-12-01"));
});

test("candidatura nunca depende de função/experiência, só da oportunidade", () => {
  assert.deepEqual(canApply({ opportunity: base, alreadyApplied: false, today: "2026-10-01" }), { ok: true });
  assert.deepEqual(canApply({ opportunity: base, alreadyApplied: true, today: "2026-10-01" }), { ok: false, reason: "ALREADY_APPLIED" });
  assert.deepEqual(canApply({ opportunity: { ...base, status: "FILLED" }, alreadyApplied: false, today: "2026-10-01" }), { ok: false, reason: "NOT_OPEN" });
});

test("turno que atravessa a meia-noite", () => {
  assert.deepEqual(shiftToRange("18:00", "02:00"), [1080, 1560]);
});

const sat: AvailabilitySlot = { kind: "AVAILABLE", weekday: 6, date: null, startTime: "18:00", endTime: "03:00" };

test("agenda: combina, diverge, indisponível e desconhecida (nunca bloqueia)", () => {
  // 2026-10-10 é sábado
  assert.equal(evaluateAgendaFit(base, [sat]), "MATCH");
  assert.equal(evaluateAgendaFit({ ...base, startDate: "2026-10-12" }, [sat]), "MISMATCH");
  assert.equal(
    evaluateAgendaFit(base, [sat, { kind: "UNAVAILABLE", weekday: null, date: "2026-10-10", startTime: null, endTime: null }]),
    "UNAVAILABLE",
  );
  assert.equal(evaluateAgendaFit(base, []), "UNKNOWN");
  assert.equal(
    evaluateAgendaFit({ ...base, type: "RECURRING", startDate: null, recurrenceDays: [5, 6] }, [sat]),
    "PARTIAL",
  );
});

test("feed: urgente primeiro, depois relevância", () => {
  const now = new Date();
  const ranked = rankFeed(
    [
      { id: "a", urgent: false, startDate: "2026-10-10", createdAt: now, cityId: "jf", agendaFit: "MATCH" as const },
      { id: "b", urgent: true, startDate: "2026-10-07", createdAt: now, cityId: "matias", agendaFit: "UNKNOWN" as const },
      { id: "c", urgent: false, startDate: "2026-10-09", createdAt: now, cityId: "matias", agendaFit: "MISMATCH" as const },
    ],
    { today: "2026-10-07", mainCityId: "jf" },
  );
  assert.deepEqual(ranked.map((r) => r.id), ["b", "a", "c"]);
});

test("transições de status", () => {
  assert.ok(canMoveApplication("SENT", "SELECTED"));
  assert.ok(!canMoveApplication("COMPLETED", "CANCELLED"));
  assert.ok(canMoveContract("ACTIVE", "AWAITING_CONFIRMATION"));
  assert.ok(!canMoveContract("ACTIVE", "COMPLETED")); // precisa das duas partes
});

test("avaliação só após trabalho concluído, uma por lado", () => {
  assert.deepEqual(canReview({ contractStatus: "ACTIVE", alreadyReviewed: false }), { ok: false, reason: "NOT_COMPLETED" });
  assert.deepEqual(canReview({ contractStatus: "COMPLETED", alreadyReviewed: true }), { ok: false, reason: "ALREADY_REVIEWED" });
  assert.ok(validateScores("CONTRACTOR_TO_FREELANCER", 5, { punctuality: 5, professionalism: 4, communication: 5, quality: 5 }));
  assert.ok(!validateScores("FREELANCER_TO_CONTRACTOR", 5, { payment: 6, organization: 4, communication: 5, respect: 5 }));
  assert.equal(averageRating([5, 4, 5]), 4.7);
  assert.equal(averageRating([]), null);
});

test("hoje no fuso de Juiz de Fora", () => {
  // 02:00 UTC de 08/10 ainda é 07/10 em São Paulo
  assert.equal(todayISO(new Date("2026-10-08T02:00:00Z")), "2026-10-07");
});

test("filtro 'combina comigo' é opcional e usa funções + agenda", () => {
  assert.ok(matchesMyProfile({ roleId: "bar", agendaFit: "MATCH" }, { roleIds: ["bar"] }));
  assert.ok(!matchesMyProfile({ roleId: "gar", agendaFit: "MATCH" }, { roleIds: ["bar"] }));
  assert.ok(!matchesMyProfile({ roleId: "bar", agendaFit: "MISMATCH" }, { roleIds: ["bar"] }));
  assert.ok(matchesMyProfile({ roleId: "gar", agendaFit: "UNKNOWN" }, { roleIds: [] }));
});

test("duração do turno", () => {
  assert.equal(shiftHours("18:00", "00:00"), 6);
  assert.equal(shiftHours("20:00", "03:00"), 7);
  assert.equal(shiftHours(null, "03:00"), null);
});
