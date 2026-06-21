import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Prefixos das rotas administrativas protegidas (grupo (admin)).
const PROTECTED_PREFIXES = [
  "/usuarios",
  "/telas",
  "/marquees",
  "/banners",
  "/eventos",
  "/conteudos",
  "/obras",
];

/**
 * STUB de guarda de sessão (Plano 00): sem sessão Supabase nas rotas (admin) → /login.
 * A sessão única (Redis) + verificação AAL2 (2FA) entram no Plano 01.
 * Ver docs/arquitetura/transversal-totp-e-sessao.md.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
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
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      user = u;
    } catch {
      user = null;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
