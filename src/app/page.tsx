"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { ReplyGenerator } from "@/components/ReplyGenerator";
import { SavedRepliesList, type SavedReply } from "@/components/SavedRepliesList";
import { ShieldCheck, Zap, Lock } from "lucide-react";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [replies, setReplies] = useState<SavedReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const fetchReplies = useCallback(async () => {
    setLoadingReplies(true);
    try {
      const res = await fetch("/api/replies");
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
      data: { user },
    } = await supabase.auth.getUser();

    if (user && user.email) {
      setUserEmail(user.email);
      fetchReplies();
    } else {
      setUserEmail(null);
      setReplies([]);
    }
  }, [fetchReplies]);

  useEffect(() => {
    checkUser();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        fetchReplies();
      } else {
        setUserEmail(null);
        setReplies([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser, fetchReplies]);

  async function handleDeleteReply(id: string) {
    try {
      const res = await fetch(`/api/replies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReplies((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0D1117] text-[#C9D1D9]">
      <Navbar
        userEmail={userEmail}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          setUserEmail(null);
          setReplies([]);
        }}
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header Hero Banner */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#30363D] bg-gradient-to-r from-[#161B22] via-[#161B22] to-[#1C2128] p-6 shadow-xl sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#7EE787]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7EE787]">
                  Project #2 Proof of Work
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Turn Difficult Customer Messages into Closed Sales &amp; 5-Star Reviews.
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs text-[#8B949E] sm:text-sm">
                Powered by Google Gemini 3.8 Flash + Supabase Row Level Security.
                Every user&apos;s history is isolated and private.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 sm:items-end">
              <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                <ShieldCheck className="h-4 w-4 text-[#7EE787]" />
                <span>Supabase Auth &amp; RLS Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                <Zap className="h-4 w-4 text-[#58A6FF]" />
                <span>Gemini API Streaming Backend</span>
              </div>
            </div>
          </div>

          {/* Not signed in notice */}
          {!userEmail && (
            <div className="flex items-center justify-between rounded-xl border border-[#D29922]/30 bg-[#D29922]/10 p-4 text-xs text-[#E3B341]">
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Guest Mode:</strong> You can test generating replies, but to save your
                  generations to your private database history, please sign in.
                </span>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="shrink-0 rounded-lg bg-[#238636] px-3 py-1.5 font-semibold text-white transition hover:bg-[#2EA043]"
              >
                Sign in free
              </button>
            </div>
          )}

          {/* Main AI Generator Workspace */}
          <ReplyGenerator
            userEmail={userEmail}
            onOpenAuth={() => setAuthModalOpen(true)}
            onReplyGenerated={fetchReplies}
          />

          {/* Saved Replies History (Only visible or loaded when user is logged in) */}
          {userEmail && (
            <SavedRepliesList
              replies={replies}
              loading={loadingReplies}
              onDelete={handleDeleteReply}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-[#30363D] bg-[#161B22] py-6 text-center text-xs text-[#8B949E]">
        <p>ReplyGenius — Built with Next.js 16, Supabase Auth &amp; RLS, and Gemini API.</p>
      </footer>

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
