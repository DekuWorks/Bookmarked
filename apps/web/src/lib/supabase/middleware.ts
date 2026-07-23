import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { assertSupabaseEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = assertSupabaseEnv();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password");
  const isProfileSetup = path.startsWith("/profile/setup");
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/library") ||
    path.startsWith("/search") ||
    path.startsWith("/profile") ||
    path.startsWith("/books") ||
    path.startsWith("/book") ||
    path.startsWith("/reading-room");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    const hasProfile = Boolean(profile?.username?.trim());

    if (!hasProfile && !isProfileSetup) {
      const url = request.nextUrl.clone();
      url.pathname = "/profile/setup";
      return NextResponse.redirect(url);
    }

    if (hasProfile && isProfileSetup) {
      const url = request.nextUrl.clone();
      url.pathname = "/reading-room";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = profile?.username?.trim() ? "/reading-room" : "/profile/setup";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
