import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mientras Supabase no esté configurado (variables vacías), no refrescamos
  // sesión: dejamos pasar la petición para no romper el desarrollo local.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No ejecutar código entre createServerClient y getUser():
  // un error sutil podría dificultar la depuración de sesiones cerradas al azar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const protectedPrefixes = [
    "/mi-perfil",
    "/subir-obra",
    "/publicar-servicio",
    "/admin",
  ];
  const isProtected = protectedPrefixes.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  // Sin sesión en ruta protegida → a /login.
  if (isProtected && !user) {
    return redirectTo(request, supabaseResponse, "/login");
  }

  // /admin requiere además is_admin.
  const isAdminPath = path === "/admin" || path.startsWith("/admin/");
  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return redirectTo(request, supabaseResponse, "/");
    }
  }

  return supabaseResponse;
}

// Redirige preservando las cookies de sesión que pudo refrescar getUser().
function redirectTo(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}
