import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSession, touchSession } from "@/lib/redis";

// Rotas administrativas protegidas (grupo (admin)).
const PROTECTED_PREFIXES = [
  "/usuarios",
  "/telas",
  "/marquees",
  "/banners",
  "/eventos",
  "/conteudos",
  "/obras",
];
const KARMA_SID = "karma_sid";

/**
 * Guarda das rotas (admin): exige sessão **AAL2** (2FA), **sessão única** (cookie
 * karma_sid == Redis) e admin **ativo**; renova o TTL de inatividade.
 * Ver docs/arquitetura/transversal-totp-e-sessao.md (RF-LOGIN-004/RN-003/004/005).
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  let response = NextResponse.next({ request });
  if (!isProtected) return response;

  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anon) return toLogin();

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

  // 2FA obrigatório (AAL2).
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return toLogin();

  // Admin precisa estar ativo (RN-LOGIN-004).
  const { data: admin } = await supabase
    .from("admin_user")
    .select("status")
    .eq("id", user.id)
    .single();
  if (!admin || admin.status !== "ativo") return toLogin();

  // Sessão única: cookie deve bater com o Redis (RF-LOGIN-004).
  const sid = request.cookies.get(KARMA_SID)?.value;
  const current = sid ? await getSession(user.id) : null;
  if (!sid || current !== sid) return toLogin();

  // Renova TTL de inatividade (RN-LOGIN-005).
  await touchSession(user.id);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
