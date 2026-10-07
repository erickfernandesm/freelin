import "server-only";
import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Neon (produção/Cloudflare): driver adapter serverless, um cliente por requisição —
 * no Workers, conexões abertas numa requisição não podem ser reutilizadas em outra.
 * Postgres comum (desenvolvimento local): cliente padrão, reaproveitado entre requisições.
 */
const url = process.env.DATABASE_URL ?? "";
const useNeon = /\.neon\.tech/.test(url);
const log: Array<"warn" | "error"> = process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

function createClient() {
  return useNeon
    ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }), log })
    : new PrismaClient({ log });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const perRequest = cache(createClient);

function current(): PrismaClient {
  if (useNeon) return perRequest();
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = current();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
