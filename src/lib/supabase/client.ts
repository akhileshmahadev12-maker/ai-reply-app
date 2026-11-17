import { createBrowserClient } from "@supabase/ssr";
import { parseCookie, stringifySetCookie } from "cookie";
import { getSupabaseCookieOptions } from "./utils";

const MIRROR_KEY = "rg_supabase_cookie_mirror";

function getLocalMirror(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalMirror(data: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}

function parseCookies(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!str) return result;
  try {
    const parsed = parseCookie(str);
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") {
        result[k] = v;
      }
    }
  } catch {
    str.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > -1) {
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        if (key) result[key] = decodeURIComponent(val);
      }
    });
  }
  return result;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    path?: string;
    sameSite?: "none" | "lax" | "strict" | boolean;
    secure?: boolean;
    maxAge?: number;
    domain?: string;
    expires?: Date;
  }
): string {
  try {
    return stringifySetCookie({
      name,
      value,
      path: options.path,
      sameSite: options.sameSite,
      secure: options.secure,
      maxAge: options.maxAge,
      domain: options.domain,
      expires: options.expires,
    });
  } catch {
    let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (options.maxAge != null) str += `; Max-Age=${options.maxAge}`;
    if (options.domain) str += `; Domain=${options.domain}`;
    if (options.path) str += `; Path=${options.path}`;
    if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
    if (options.secure) str += `; Secure`;
    if (options.sameSite) {
      const ss = options.sameSite === true ? "Strict" : options.sameSite;
      str += `; SameSite=${ss}`;
    }
    return str;
  }
}

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
    );
  }

  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }

  const isHttps = window.location.protocol === "https:";
  const defaultCookieOptions = getSupabaseCookieOptions(isHttps);

  supabaseBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    {
      cookieOptions: defaultCookieOptions,
      cookies: {
        getAll() {
          const parsed = parseCookies(document.cookie || "");
          const mirror = getLocalMirror();
          // Merge missing keys from mirror into parsed document.cookie
          return Object.entries({ ...mirror, ...parsed }).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          const mirror = getLocalMirror();
          let mirrorChanged = false;

          cookiesToSet.forEach(({ name, value, options }) => {
            const isDeleting = !value || options?.maxAge === 0;

            const cookieStr = serializeCookie(name, value, {
              path: options?.path ?? defaultCookieOptions.path,
              sameSite: defaultCookieOptions.sameSite,
              secure: defaultCookieOptions.secure,
              maxAge: options?.maxAge,
              domain: options?.domain,
              expires: options?.expires,
            });

            document.cookie = cookieStr;

            if (isDeleting) {
              if (name in mirror) {
                delete mirror[name];
                mirrorChanged = true;
              }
            } else {
              mirror[name] = value;
              mirrorChanged = true;
            }
          });

          if (mirrorChanged) {
            setLocalMirror(mirror);
          }
        },
      },
    }
  );

  return supabaseBrowserClient;
}
