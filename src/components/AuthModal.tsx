"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg("Could not initiate Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          onSuccess();
          onClose();
        } else {
          setSuccessMsg(
            "Account created. You can sign in now or confirm via email if enabled."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        onSuccess();
        onClose();
      }
    } catch {
      setErrorMsg("Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717A] transition hover:text-[#18181B]"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181B] text-white font-mono text-[11px] font-bold tracking-tighter">
            RG
          </div>
          <h2 className="text-base font-semibold tracking-tight text-[#18181B]">
            {mode === "signin" ? "Sign in to ReplyGenius" : "Create account"}
          </h2>
        </div>

        <p className="mt-2 text-xs text-[#71717A]">
          {mode === "signin"
            ? "Access your saved reply history and private generation workspace."
            : "Sign up free to store and manage your generated replies."}
        </p>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-[#E4E4E7] bg-white text-xs font-semibold text-[#18181B] shadow-xs transition hover:bg-[#F4F4F5] active:scale-[0.98] disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#71717A]" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{mode === "signin" ? "Sign in with Google" : "Sign up with Google"}</span>
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[#E4E4E7]" />
          <span className="absolute bg-white px-2 text-[11px] font-medium text-[#71717A]">
            or continue with email
          </span>
        </div>

        <form onSubmit={handleAuth} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#27272A]">
              Work email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#27272A]">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-2.5 text-xs text-[#E11D48]">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-2.5 text-xs text-[#16A34A]">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-[#18181B] text-sm font-semibold text-white shadow-xs transition hover:bg-[#27272A] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-[#71717A]">
          {mode === "signin" ? (
            <>
              Need an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="font-semibold text-[#18181B] underline underline-offset-2 hover:text-black"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="font-semibold text-[#18181B] underline underline-offset-2 hover:text-black"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
