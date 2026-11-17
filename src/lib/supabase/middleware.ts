import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseCookieOptions, isHttpsFromHeaders } from "./utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const isHttps = isHttpsFromHeaders(request.headers, request.url);
  const cookieOptions = getSupabaseCookieOptions(isHttps);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: options?.path ?? cookieOptions.path,
              sameSite: cookieOptions.sameSite,
              secure: cookieOptions.secure,
            })
          );
        },
      },
    }
  );

  // Refresh auth session
  await supabase.auth.getUser();

  return supabaseResponse;
}
