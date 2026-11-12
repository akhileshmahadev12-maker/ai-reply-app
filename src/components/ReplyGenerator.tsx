"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw, Send, CheckCircle2 } from "lucide-react";

interface ReplyGeneratorProps {
  userEmail: string | null;
  onOpenAuth: () => void;
  onReplyGenerated: () => void;
}

const TONES = [
  {
    id: "empathetic",
    label: "Empathetic & Apologetic",
    desc: "For angry reviews, shipment delays, or upset customers",
  },
  {
    id: "professional",
    label: "Professional & Firm",
    desc: "For contract limits, polite pushbacks, and clear policy explanations",
  },
  {
    id: "sales",
    label: "High-Converting Sales Hook",
    desc: "Turn general inquiries into booked calls or checkout completions",
  },
  {
    id: "friendly",
    label: "Warm & Conversational",
    desc: "Approachable, clear communication for DMs and creator communities",
  },
];

const PRESETS = [
  {
    label: "Angry 1-Star Review",
    message:
      "This product is completely broken. I was charged $49 and got zero support response for three days. Refund my money immediately or I am calling my bank.",
    tone: "empathetic",
    extra: "Offer an immediate refund and two free months of service as an apology.",
  },
  {
    label: "Client Asking for 50% Discount",
    message:
      "Hey, we love your tool but your $400 monthly price is too high for our budget right now. Can you do $200 per month or give us half off?",
    tone: "sales",
    extra: "Hold firm on price, but offer a quarterly payment option or a smaller starter tier.",
  },
  {
    label: "Inbound Enterprise Lead",
    message:
      "Hi, we are a team of fifteen looking for an automated solution. Do you support team roles and how fast can our team onboard?",
    tone: "sales",
    extra: "Highlight 24 hour onboarding and offer a ten minute live setup walkthrough.",
  },
];

export function ReplyGenerator({
  userEmail,
  onOpenAuth,
  onReplyGenerated,
}: ReplyGeneratorProps) {
  const [customerMessage, setCustomerMessage] = useState("");
  const [tone, setTone] = useState("empathetic");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!userEmail) {
      onOpenAuth();
      return;
    }

    if (!customerMessage.trim()) {
      setErrorMsg("Please paste or type a customer message first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerMessage,
          tone,
          extraInstructions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to generate reply.");
        return;
      }

      setReply(data.reply);
      onReplyGenerated();
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* 1-Click Demo Scenarios */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#71717A]">
          Sample scenarios:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setCustomerMessage(p.message);
              setTone(p.tone);
              setExtraInstructions(p.extra);
            }}
            className="rounded-full border border-[#E4E4E7] bg-white px-3 py-1 text-xs font-medium text-[#3F3F46] transition hover:border-[#18181B] hover:text-[#18181B] active:scale-[0.98]"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Form Card */}
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs sm:p-6 lg:col-span-7">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#18181B]">
                  Customer message or review
                </label>
                <span className="font-mono text-[11px] text-[#A1A1AA]">
                  {customerMessage.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Paste the angry customer email, review, or pricing inquiry here..."
                className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3.5 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#18181B]">
                Response tone
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {TONES.map((t) => {
                  const isSelected = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition active:scale-[0.98] ${
                        isSelected
                          ? "border-[#18181B] bg-[#F4F4F5] text-[#18181B]"
                          : "border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#A1A1AA] hover:text-[#18181B]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-[#18181B]">
                          {t.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#18181B]" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#71717A]">
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-[#18181B]">
                Key points to include (optional)
              </label>
              <input
                type="text"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. Offer 15% discount, or emphasize 24 hour onboarding"
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 text-xs text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18181B]"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-3 text-xs text-[#E11D48]">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#18181B] text-sm font-semibold text-white shadow-xs transition hover:bg-[#27272A] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating with Gemini
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate response
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Response Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#18181B]">
                <Send className="h-3.5 w-3.5 text-[#18181B]" />
                Generated draft
              </span>
              {reply && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-1 text-xs font-semibold text-[#18181B] transition hover:bg-[#F4F4F5] active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy text
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-4">
              {reply ? (
                <div className="max-h-[380px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 text-xs leading-relaxed text-[#27272A]">
                  {reply}
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E4E7] bg-[#FAFAFA] p-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E4E4E7] text-[#71717A] shadow-2xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#18181B]">
                    Your AI response will appear here
                  </p>
                  <p className="mt-1 text-[11px] text-[#71717A] max-w-xs">
                    Select a scenario or paste your customer inquiry on the left to test.
                  </p>
                </div>
              )}
            </div>
          </div>

          {reply && (
            <div className="mt-4 flex items-center justify-between border-t border-[#F4F4F5] pt-3 text-[11px] text-[#71717A]">
              <span>Saved to your private Supabase database</span>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading}
                className="inline-flex items-center gap-1 font-semibold text-[#18181B] hover:underline disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
