import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseCookieOptions, isHttpsFromHeaders } from "./utils";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export async function createClient(accessToken?: string) {
  const cookieStore = await cookies();
  let isHttps = process.env.NODE_ENV === "production";
  try {
    const headersList = await headers();
    isHttps = isHttpsFromHeaders(headersList);
  } catch {
    // headers() might not be available in all contexts
  }

  const cookieOptions = getSupabaseCookieOptions(isHttps);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                path: options?.path ?? cookieOptions.path,
                sameSite: cookieOptions.sameSite,
                secure: cookieOptions.secure,
              })
            );
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
      global: accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined,
    }
  );
}

export async function getAuthenticatedServerClient(request?: Request): Promise<{
  supabase: SupabaseClient;
  user: User | null;
}> {
  const cookieClient = await createClient();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();

  if (cookieUser) {
    return { supabase: cookieClient, user: cookieUser };
  }

  // Fallback to Bearer token from request or headers()
  let authHeader = request?.headers.get("authorization") || request?.headers.get("Authorization");
  if (!authHeader) {
    try {
      const headersList = await headers();
      authHeader = headersList.get("authorization") || headersList.get("Authorization");
    } catch {
      // headers() not available or in unsupported context
    }
  }

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const tokenClient = await createClient(bearerToken);
      const {
        data: { user: tokenUser },
      } = await tokenClient.auth.getUser(bearerToken);

      if (tokenUser) {
        return { supabase: tokenClient, user: tokenUser };
      }
    }
  }

  return { supabase: cookieClient, user: null };
}
