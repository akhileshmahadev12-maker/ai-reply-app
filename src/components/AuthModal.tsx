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
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

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

        <form onSubmit={handleAuth} className="mt-5 space-y-3.5">
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
