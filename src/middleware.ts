import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/dashboard", "/crm", "/horas", "/auditoria", "/perfil", "/tickets", "/proyectos", "/usuarios", "/documentos", "/notificaciones", "/servicio", "/reportes", "/ajustes", "/kb"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Seguridad: headers base.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const needsAuth = PROTECTED.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!needsAuth) return response;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet: { name: string; value: string; options?: object }[]) => {
            toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    // Sin Auth disponible (caída red/Supabase): dejar pasar, cada página valida sesión.
  }
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/crm/:path*", "/horas/:path*", "/auditoria/:path*", "/perfil/:path*", "/tickets/:path*", "/tickets", "/proyectos/:path*", "/usuarios/:path*", "/documentos/:path*", "/notificaciones/:path*", "/servicio/:path*", "/reportes/:path*", "/ajustes/:path*", "/kb/:path*"] };
