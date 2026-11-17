"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { ReplyGenerator } from "@/components/ReplyGenerator";
import { SavedRepliesList, type SavedReply } from "@/components/SavedRepliesList";
import { ShieldCheck, Zap, Lock, ArrowRight, X } from "lucide-react";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [replies, setReplies] = useState<SavedReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handlingCallbackRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  const fetchReplies = useCallback(async (tokenOverride?: string) => {
    setLoadingReplies(true);
    try {
      const activeToken = tokenOverride || tokenRef.current;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch("/api/replies", { headers });
      const data = await res.json();
      setReplies(data.replies || []);
    } catch {
      console.error("Failed to load replies");
    } finally {
      setLoadingReplies(false);
    }
  }, []);

  const checkUser = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const identity =
        session.user.email ||
        session.user.user_metadata?.email ||
        session.user.id;
      setUserEmail(identity);
      setAccessToken(session.access_token);
      tokenRef.current = session.access_token;
      fetchReplies(session.access_token);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const identity = user.email || user.user_metadata?.email || user.id;
      setUserEmail(identity);
      fetchReplies();
    } else if (!handlingCallbackRef.current) {
      setUserEmail(null);
      setAccessToken(null);
      tokenRef.current = null;
      setReplies([]);
    }
  }, [fetchReplies]);

  useEffect(() => {
    const processAuthFromUrl = async () => {
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const searchParams = url.searchParams;

      // 1. Check query error params
      const queryError =
        searchParams.get("auth_error") ||
        searchParams.get("error_description") ||
        searchParams.get("error");

      // 2. Check hash error or token params (#error=... or #access_token=...)
      const rawHash = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(rawHash);
      const hashError =
        hashParams.get("error_description") || hashParams.get("error");

      const detectedError = queryError || hashError;
      if (detectedError) {
        setAuthError(detectedError);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // 3. Fallback code exchange if Supabase redirected directly to / instead of /auth/callback
      const code = searchParams.get("code");
      if (code) {
        handlingCallbackRef.current = true;
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setAuthError(error.message);
          } else if (data.session) {
            const identity =
              data.session.user.email ||
              data.session.user.user_metadata?.email ||
              data.session.user.id;
            setUserEmail(identity);
            setAccessToken(data.session.access_token);
            tokenRef.current = data.session.access_token;
            fetchReplies(data.session.access_token);
          }
        } catch {
          setAuthError("Failed to complete authorization code exchange.");
        } finally {
          handlingCallbackRef.current = false;
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      // 4. Fallback hash access_token exchange (#access_token=...&refresh_token=...)
      const accessTokenFromHash = hashParams.get("access_token");
      const refreshTokenFromHash = hashParams.get("refresh_token");
      if (accessTokenFromHash && refreshTokenFromHash) {
        handlingCallbackRef.current = true;
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.setSession({
            access_token: accessTokenFromHash,
            refresh_token: refreshTokenFromHash,
          });
          if (error) {
            setAuthError(error.message);
          } else if (data.session) {
            const identity =
              data.session.user.email ||
              data.session.user.user_metadata?.email ||
              data.session.user.id;
            setUserEmail(identity);
            setAccessToken(data.session.access_token);
            tokenRef.current = data.session.access_token;
            fetchReplies(data.session.access_token);
          }
        } catch {
          setAuthError("Failed to restore session from URL.");
        } finally {
          handlingCallbackRef.current = false;
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      // 5. Default initial check
      await checkUser();
    };

    processAuthFromUrl();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const identity =
            session.user.email ||
            session.user.user_metadata?.email ||
            session.user.id;
          setUserEmail(identity);
          setAccessToken(session.access_token);
          tokenRef.current = session.access_token;
          fetchReplies(session.access_token);
        } else if (!handlingCallbackRef.current) {
          setUserEmail(null);
          setAccessToken(null);
          tokenRef.current = null;
          setReplies([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser, fetchReplies]);

  async function handleDeleteReply(id: string) {
    try {
      const activeToken = tokenRef.current;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`/api/replies/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setReplies((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#18181B]">
      {/* Floating Header */}
      <Navbar
        userEmail={userEmail}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          setUserEmail(null);
          setAccessToken(null);
          tokenRef.current = null;
          setReplies([]);
        }}
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-10">
          {/* Auth Error Banner */}
          {authError && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-xs text-[#E11D48] shadow-xs">
              <div className="space-y-1">
                <p className="font-semibold">Sign In Verification Error: {authError}</p>
                <p className="text-[#9F1239]">
                  Please ensure <code>{typeof window !== "undefined" ? window.location.origin : ""}/auth/callback</code> is added to your Supabase Dashboard under <strong>Authentication &rarr; URL Configuration &rarr; Redirect URLs</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="rounded-md p-1 hover:bg-[#FFE4E6] text-[#9F1239] transition"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Hero Section */}
          <section className="pt-8 sm:pt-12">
            <div className="max-w-[680px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E4E7] bg-white px-3 py-1 text-xs font-medium text-[#52525B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#18181B]" />
                Customer communication copilot
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.12]">
                <span className="bg-gradient-to-r from-black to-[#666666] bg-clip-text text-transparent">
                  Turn difficult customer notes
                </span>
                <br />
                into closed sales and loyalty
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[#71717A] text-pretty">
                Draft empathetic replies to angry reviews, resolve pricing pushback, and turn
                hesitant leads into buyers using Gemini 3.8 Flash with your own private Supabase history.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-[#71717A]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#18181B]" />
                  Private database isolated with Supabase RLS
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-[#18181B]" />
                  Zero latency generation
                </span>
              </div>
            </div>
          </section>

          {/* Guest Mode Notice */}
          {!userEmail && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E4E4E7] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs text-[#52525B]">
                <Lock className="h-4 w-4 shrink-0 text-[#18181B]" />
                <span>
                  <strong>Guest Mode:</strong> You can test generation freely. Sign in to save and access your history across devices.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#18181B] underline underline-offset-2 hover:text-black"
              >
                Sign in free
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Main AI Generator Workspace */}
          <ReplyGenerator
            userEmail={userEmail}
            accessToken={accessToken}
            onOpenAuth={() => setAuthModalOpen(true)}
            onReplyGenerated={fetchReplies}
          />

          {/* Saved History */}
          {userEmail && (
            <SavedRepliesList
              replies={replies}
              loading={loadingReplies}
              onDelete={handleDeleteReply}
            />
          )}

          {/* Mandatory Tagline Reveal Section from ai-design-skills B11 */}
          <section className="border-t border-[#E4E4E7] pt-14 pb-10 text-center">
            <div className="mx-auto max-w-[680px]">
              <p className="text-2xl font-semibold tracking-tight text-[#18181B] sm:text-3xl text-balance">
                The fastest way to de-escalate angry tickets and close hesitant prospects.
              </p>
              <p className="mt-3 text-xs text-[#71717A] text-pretty">
                Consistent tone across every message, backed by private account history and sub-second generation.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[#E4E4E7] bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-3 px-4 text-xs text-[#71717A] sm:px-6">
          <p>ReplyGenius &mdash; Built with Next.js 16, Supabase Auth, and Gemini 3.8.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#18181B]">Privacy</a>
            <a href="#" className="hover:text-[#18181B]">Terms</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          checkUser();
        }}
      />
    </div>
  );
}
