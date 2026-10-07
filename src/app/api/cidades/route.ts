import { getCurrentUser } from "@/server/auth/session";
import { searchCities } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Usado no cadastro (já autenticado) e nas buscas internas
  if (!(await getCurrentUser())) return Response.json([], { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").slice(0, 60);
  const near = searchParams.get("perto") ?? undefined;
  const cities = await searchCities(q, { near });
  return Response.json(cities, { headers: { "Cache-Control": "private, max-age=300" } });
}
