"use client";

import { Sparkles, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({ userEmail, onOpenAuth, onLogout }: NavbarProps) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onLogout();
  }

  return (
    <header className="border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#238636] to-[#1F6FEB] text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              ReplyGenius
              <span className="rounded-full bg-[#238636]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7EE787] border border-[#238636]/40">
                Gemini 3.8
              </span>
            </h1>
            <p className="text-[11px] text-[#8B949E]">
              AI customer &amp; sales reply copilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs text-[#C9D1D9]">
                <User className="h-3.5 w-3.5 text-[#58A6FF]" />
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#21262D] px-3 py-1.5 text-xs font-medium text-[#C9D1D9] transition hover:bg-[#30363D] hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-lg bg-[#238636] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2EA043] shadow-sm"
            >
              Sign in / Sign up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
