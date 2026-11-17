"use client";

import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/utils";

interface NavbarProps {
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({ userEmail, onOpenAuth, onLogout }: NavbarProps) {
  async function handleLogout() {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Sign out error:", e);
      }
    }
    onLogout();
  }

  return (
    <div className="sticky top-4 z-40 px-4 sm:px-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-[#E4E4E7] bg-white/85 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18181B] text-white font-mono text-xs font-bold tracking-tighter">
            RG
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-[#18181B]">
              ReplyGenius
            </span>
            <span className="hidden sm:inline-block font-mono text-[11px] text-[#71717A]">
              Gemini 3.8
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2.5">
          {userEmail ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-[#F4F4F5] px-2.5 py-1 font-mono text-xs text-[#27272A] sm:inline-flex">
                <User className="h-3.5 w-3.5 text-[#71717A]" />
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#18181B] transition hover:bg-[#F4F4F5] active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center justify-center rounded-lg bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#27272A] active:scale-[0.98]"
            >
              Sign in
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
