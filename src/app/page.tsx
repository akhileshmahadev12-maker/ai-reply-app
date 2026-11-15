"use client";

import { useEffect, useState, useCallback } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { ReplyGenerator } from "@/components/ReplyGenerator";
import { SavedRepliesList, type SavedReply } from "@/components/SavedRepliesList";
import { ShieldCheck, Zap, Lock, ArrowRight } from "lucide-react";

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
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.email) {
      setUserEmail(session.user.email);
      fetchReplies();
      return;
    }

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
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
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
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#18181B]">
      {/* Floating Header */}
      <Navbar
        userEmail={userEmail}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          setUserEmail(null);
          setReplies([]);
        }}
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-10">
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
