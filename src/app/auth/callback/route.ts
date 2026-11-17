import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseCookieOptions, isHttpsFromHeaders } from "@/lib/supabase/utils";

interface PendingCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error") || searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  const isPopup = searchParams.get("popup") === "1";

  // Validate next url so it starts with / and not //
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Resolve base origin via x-forwarded-host and proto
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isHttps = isHttpsFromHeaders(request.headers, request.url);
  const proto = isHttps ? "https" : "http";
  const baseOrigin = forwardedHost ? `${proto}://${forwardedHost}` : origin;
  const redirectUrl = `${baseOrigin}${next}`;

  // If Supabase or Google passed an explicit error
  if (errorParam || errorDescription) {
    const errorMessage = errorDescription || errorParam || "Authentication failed.";
    if (isPopup) {
      return new Response(
        `<!DOCTYPE html>
<html>
  <head><title>Authentication Error</title></head>
  <body>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({
            type: "SUPABASE_AUTH_ERROR",
            error: ${JSON.stringify(errorMessage)}
          }, window.location.origin);
          window.close();
        } else {
          window.location.replace("${baseOrigin}/?auth_error=" + encodeURIComponent(${JSON.stringify(errorMessage)}));
        }
      } catch (e) {
        window.location.replace("${baseOrigin}/?auth_error=" + encodeURIComponent(${JSON.stringify(errorMessage)}));
      }
    </script>
  </body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }
    return NextResponse.redirect(`${baseOrigin}/?auth_error=${encodeURIComponent(errorMessage)}`);
  }

  if (code) {
    const pendingCookies: PendingCookie[] = [];
    const cookieStore = await cookies();
    const cookieOptions = getSupabaseCookieOptions(isHttps);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      {
        cookieOptions,
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((c) => {
              const opts = {
                ...c.options,
                path: c.options?.path ?? cookieOptions.path,
                sameSite: cookieOptions.sameSite,
                secure: cookieOptions.secure,
              };
              pendingCookies.push({
                name: c.name,
                value: c.value,
                options: opts,
              });
              try {
                cookieStore.set(c.name, c.value, opts);
              } catch {
                // Ignore cookieStore mutation errors in streaming contexts
              }
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      if (isPopup) {
        const response = new NextResponse(
          `<!DOCTYPE html>
<html>
  <head><title>Authentication Successful</title></head>
  <body>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({
            type: "SUPABASE_AUTH_SUCCESS",
            access_token: "${data.session.access_token}",
            refresh_token: "${data.session.refresh_token}"
          }, window.location.origin);
          window.close();
        } else {
          window.location.replace("${redirectUrl}");
        }
      } catch (e) {
        window.location.replace("${redirectUrl}");
      }
    </script>
  </body>
</html>`,
          {
            headers: {
              "Content-Type": "text/html",
              "Cache-Control": "no-store, max-age=0",
            },
          }
        );

        pendingCookies.forEach((c) => {
          response.cookies.set(c.name, c.value, c.options);
        });

        return response;
      }

      // Standard non-popup redirect
      const redirectResponse = NextResponse.redirect(redirectUrl);
      pendingCookies.forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c.options);
      });
      return redirectResponse;
    }

    // Code exchange failed on server
    const errorMessage = error?.message || "Failed to exchange authorization code for session.";
    if (isPopup) {
      // If running inside a popup and exchangeCodeForSession failed (e.g. PKCE verifier lives in parent window/iframe),
      // post SUPABASE_OAUTH_CODE back so parent window can complete exchange with its local code_verifier
      return new Response(
        `<!DOCTYPE html>
<html>
  <head><title>Completing Authentication</title></head>
  <body>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({
            type: "SUPABASE_OAUTH_CODE",
            code: "${code}",
            serverError: ${JSON.stringify(errorMessage)}
          }, window.location.origin);
          window.close();
        } else {
          window.location.replace("${baseOrigin}/?auth_error=" + encodeURIComponent(${JSON.stringify(errorMessage)}));
        }
      } catch (e) {
        window.location.replace("${baseOrigin}/?auth_error=" + encodeURIComponent(${JSON.stringify(errorMessage)}));
      }
    </script>
  </body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    return NextResponse.redirect(`${baseOrigin}/?auth_error=${encodeURIComponent(errorMessage)}`);
  }

  return NextResponse.redirect(`${baseOrigin}/?auth_error=${encodeURIComponent("No authorization code provided.")}`);
}
