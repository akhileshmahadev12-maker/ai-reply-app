export interface SupabaseCookieOptions {
  path: string;
  sameSite: "none" | "lax";
  secure: boolean;
  maxAge?: number;
}

export function getSupabaseCookieOptions(isHttps: boolean): SupabaseCookieOptions {
  return {
    path: "/",
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
  };
}

export function isHttpsFromHeaders(headersList: Headers, fallbackUrl?: string): boolean {
  const forwardedProto = headersList.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  if (fallbackUrl && fallbackUrl.startsWith("https://")) {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("your-project-id") &&
    !key.includes("your_key_here") &&
    url.startsWith("http")
  );
}
