/**
 * Executado no build (Vercel/Cloudflare) antes do `next build`:
 *  1. aplica as migrações pendentes (prisma migrate deploy);
 *  2. sincroniza o catálogo: municípios do IBGE e funções.
 *
 * Idempotente: pode rodar a cada deploy. Sem DATABASE_URL, não faz nada.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url || process.env.SKIP_DB_SETUP === "1") {
  console.log("[db-setup] DATABASE_URL ausente, etapa ignorada.");
  process.exit(0);
}

// Migrações não funcionam bem pelo pooler (PgBouncer): usa a conexão direta do Neon.
const direct = (process.env.DIRECT_URL || url)
  .replace("-pooler.", ".")
  .replace(/[?&]channel_binding=[^&]*/, (m) => (m.startsWith("?") ? "?" : ""))
  .replace("?&", "?");
const env = { ...process.env, DATABASE_URL: direct, DIRECT_URL: direct };

console.log("[db-setup] aplicando migrações…");
execSync("npx prisma migrate deploy", { stdio: "inherit", env });

const normalize = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const slugify = (s) => normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const db = new PrismaClient({ datasources: { db: { url: direct } } });

try {
  // Funções
  const roles = JSON.parse(readFileSync(new URL("../prisma/data/funcoes.json", import.meta.url), "utf8"));
  for (const [i, [name, emoji]] of roles.entries()) {
    const slug = slugify(name);
    await db.role.upsert({
      where: { slug },
      update: {},
      create: { name, slug, emoji, sortOrder: i },
    });
  }

  // Municípios
  const total = await db.city.count();
  const cities = JSON.parse(readFileSync(new URL("../prisma/data/cidades.json", import.meta.url), "utf8"));
  if (total < cities.length) {
    console.log(`[db-setup] importando municípios (${total} → ${cities.length})…`);
    const rows = cities.map(([name, state, lat, lng]) => ({
      name,
      state,
      lat,
      lng,
      slug: slugify(`${name}-${state}`),
      search: normalize(name),
    }));
    for (let i = 0; i < rows.length; i += 1000) {
      await db.city.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
    }
  }
  const missing = await db.city.findMany({ where: { search: null }, select: { id: true, name: true } });
  for (const c of missing) {
    await db.city.update({ where: { id: c.id }, data: { search: normalize(c.name) } });
  }
  console.log("[db-setup] catálogo sincronizado.");
} finally {
  await db.$disconnect();
}
