import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, homeFor, verifySession, type SessionRole } from "@/server/auth/token";

// Prefixos por perfil. A checagem definitiva (incl. bloqueio) acontece no servidor;
// o middleware só evita renderizar a tela errada.
const AREAS: Array<{ prefix: string; roles: SessionRole[] }> = [
  { prefix: "/oportunidades", roles: ["FREELANCER"] },
  { prefix: "/candidaturas", roles: ["FREELANCER"] },
  { prefix: "/trabalhos", roles: ["FREELANCER"] },
  { prefix: "/perfil", roles: ["FREELANCER"] },
  { prefix: "/painel", roles: ["CONTRACTOR"] },
  { prefix: "/vagas", roles: ["CONTRACTOR"] },
  { prefix: "/contratacoes", roles: ["CONTRACTOR"] },
  { prefix: "/empresa", roles: ["CONTRACTOR"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/profissional", roles: ["FREELANCER", "CONTRACTOR", "ADMIN"] },
  { prefix: "/contratante", roles: ["FREELANCER", "CONTRACTOR", "ADMIN"] },
  { prefix: "/avisos", roles: ["FREELANCER", "CONTRACTOR", "ADMIN"] },
  { prefix: "/cursos", roles: ["FREELANCER", "CONTRACTOR", "ADMIN"] },
  { prefix: "/boas-vindas", roles: ["FREELANCER", "CONTRACTOR"] },
];

const AUTH_PAGES = ["/entrar", "/cadastro"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) || pathname === "/") {
    if (session) return NextResponse.redirect(new URL(homeFor(session.role), req.url));
    return NextResponse.next();
  }

  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();

  if (!session) {
    const url = new URL("/entrar", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!area.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|brand/|favicon.ico|apple-touch-icon.png|manifest.webmanifest).*)"],
};
