"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Sparkles } from "lucide-react";

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
            "Account created! Check your email for a confirmation link, or sign in if email confirmations are disabled."
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
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#2D3339] bg-[#161B22] p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B949E] transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#238636] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {mode === "signin" ? "Sign in to ReplyGenius" : "Create your free account"}
          </h2>
        </div>

        <p className="mt-2 text-xs text-[#8B949E]">
          {mode === "signin"
            ? "Sign in to generate and save your AI customer replies."
            : "Get instant access to AI response generation and private history."}
        </p>

        <form onSubmit={handleAuth} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#C9D1D9]">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 h-10 w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3.5 text-sm text-white placeholder:text-[#6E7681] focus:border-[#238636] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#C9D1D9]">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 h-10 w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3.5 text-sm text-white placeholder:text-[#6E7681] focus:border-[#238636] focus:outline-hidden"
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-[#F85149]/30 bg-[#F85149]/10 p-2.5 text-xs text-[#FF7B72]">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-[#238636]/30 bg-[#238636]/10 p-2.5 text-xs text-[#7EE787]">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-[#238636] text-sm font-semibold text-white transition hover:bg-[#2EA043] disabled:opacity-50"
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

        <div className="mt-4 text-center text-xs text-[#8B949E]">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="font-medium text-[#58A6FF] hover:underline"
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
                className="font-medium text-[#58A6FF] hover:underline"
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
