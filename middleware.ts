import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { touchAndGetSession } from "@/lib/redis";
import {
  GATE_COOKIE_NAME,
  GATE_MAX_AGE,
  signGate,
  verifyGate,
} from "@/lib/auth-gate";

// Rotas administrativas protegidas (grupo (admin)).
const PROTECTED_PREFIXES = [
  "/usuarios",
  "/telas",
  "/marquees",
  "/banners",
  "/eventos",
  "/conteudos",
  "/obras",
  "/historico",
];
const KARMA_SID = "karma_sid";

/**
 * Guarda das rotas (admin): exige sessão **AAL2** (2FA), **sessão única** (cookie
 * karma_sid == Redis) e admin **ativo**; renova o TTL de inatividade.
 * Ver docs/arquitetura/transversal-totp-e-sessao.md (RF-LOGIN-004/RN-003/004/005).
 *
 * Performance: a revalidação completa faz várias chamadas de rede (getUser, AAL,
 * status no banco, sessão no Redis). Para não pagar esse custo em toda navegação,
 * usamos um **gate assinado de vida curta** ([lib/auth-gate.ts]): após uma
 * revalidação bem-sucedida, as próximas navegações passam pelo fast path sem rede.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next({ request });

  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  };

  // Sem sessão única não há o que validar (também cobre logout: cookie removido).
  const sid = request.cookies.get(KARMA_SID)?.value;
  if (!sid) return toLogin();

  // Fast path: gate recém-validado, assinado e ligado ao sid atual → sem rede.
  const gate = request.cookies.get(GATE_COOKIE_NAME)?.value;
  if (await verifyGate(gate, sid)) {
    return NextResponse.next({ request });
  }

  // Slow path: revalidação completa.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anon) return toLogin();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return toLogin();

  // Checagens independentes (só dependem do usuário) em paralelo; o Redis usa
  // GETEX (lê a sessão e renova o TTL num único round-trip).
  const [aal, admin, current] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.from("admin_user").select("status").eq("id", user.id).single(),
    touchAndGetSession(user.id),
  ]);

  // 2FA obrigatório (AAL2).
  if (aal.data?.currentLevel !== "aal2") return toLogin();
  // Admin precisa estar ativo (RN-LOGIN-004).
  if (!admin.data || admin.data.status !== "ativo") return toLogin();
  // Sessão única: cookie deve bater com o Redis (RF-LOGIN-004).
  if (current !== sid) return toLogin();

  // Emite o gate assinado de vida curta: acelera as próximas navegações.
  response.cookies.set(GATE_COOKIE_NAME, await signGate(user.id, sid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE,
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
