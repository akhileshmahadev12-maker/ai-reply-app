"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw, Send } from "lucide-react";

interface ReplyGeneratorProps {
  userEmail: string | null;
  onOpenAuth: () => void;
  onReplyGenerated: () => void;
}

const TONES = [
  {
    id: "empathetic",
    label: "Empathetic & Apologetic",
    desc: "For angry reviews, delayed orders, or frustrated customers",
    icon: "🤝",
  },
  {
    id: "professional",
    label: "Professional & Firm",
    desc: "For contract limits, polite pushbacks, and clear policy explanations",
    icon: "💼",
  },
  {
    id: "sales",
    label: "High-Converting Sales Hook",
    desc: "Turn general inquiries into booked calls or checkout completions",
    icon: "🚀",
  },
  {
    id: "friendly",
    label: "Warm & Conversational",
    desc: "Casual, approachable vibe for Twitter/X, Discord, or creator DMs",
    icon: "✨",
  },
];

const PRESETS = [
  {
    label: "Angry 1-Star Review",
    message:
      "This service is completely broken. I was charged $49 and got zero support response for 3 days. Refund my money immediately or I am calling my credit card company!!",
    tone: "empathetic",
    extra: "Offer an immediate refund and 2 free months of Pro as an apology.",
  },
  {
    label: "Client Asking for 50% Discount",
    message:
      "Hey, we love your product but your $400/month plan is too high for our budget right now. Can you do $200/month or give us a 50% discount?",
    tone: "sales",
    extra: "Hold firm on price, but offer a quarterly payment option or smaller starter tier.",
  },
  {
    label: "Inbound Sales Lead",
    message:
      "Hi there, saw your landing page. We are a team of 15 looking for an automated solution. Do you support team roles and how fast can we onboard?",
    tone: "sales",
    extra: "Highlight 24-hour onboarding and offer a live 10-minute demo.",
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
      {/* Top Presets */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8B949E]">
          Quick 1-Click Demo Scenarios:
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setCustomerMessage(p.message);
                setTone(p.tone);
                setExtraInstructions(p.extra);
              }}
              className="rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-[#C9D1D9] transition hover:border-[#58A6FF] hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Input Form */}
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-lg lg:col-span-7">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#C9D1D9]">
                Customer Message / Review / Email:
              </label>
              <textarea
                rows={5}
                required
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Paste the angry customer email, review, or lead message here..."
                className="mt-1.5 w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-sm text-white placeholder:text-[#6E7681] focus:border-[#238636] focus:outline-hidden"
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#C9D1D9]">
                Choose Desired Tone:
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                      tone === t.id
                        ? "border-[#238636] bg-[#238636]/10 text-white"
                        : "border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#484F58] hover:text-[#C9D1D9]"
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-white">{t.label}</p>
                      <p className="text-[11px] leading-tight text-[#8B949E]">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Instructions */}
            <div>
              <label className="block text-xs font-semibold text-[#C9D1D9]">
                Special Instructions (Optional):
              </label>
              <input
                type="text"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. 'Offer a 15% discount code' or 'Mention our launch on Monday'"
                className="mt-1.5 h-10 w-full rounded-xl border border-[#30363D] bg-[#0D1117] px-3.5 text-xs text-white placeholder:text-[#6E7681] focus:border-[#238636] focus:outline-hidden"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-[#F85149]/30 bg-[#F85149]/10 p-3 text-xs text-[#FF7B72]">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#238636] font-semibold text-white shadow-md transition hover:bg-[#2EA043] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Reply
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-lg lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#C9D1D9]">
                <Send className="h-4 w-4 text-[#7EE787]" />
                Generated Response
              </span>
              {reply && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#21262D] px-2.5 py-1 text-xs font-medium text-[#C9D1D9] transition hover:bg-[#30363D] hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#7EE787]" />
                      Copied!
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
                <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#30363D] bg-[#0D1117] p-4 text-xs leading-relaxed text-[#E6EDF3]">
                  {reply}
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#30363D] bg-[#0D1117]/50 p-6 text-center text-[#8B949E]">
                  <Sparkles className="h-8 w-8 text-[#484F58]" />
                  <p className="mt-3 text-xs font-medium text-[#C9D1D9]">
                    Your AI-crafted reply will appear here
                  </p>
                  <p className="mt-1 text-[11px] text-[#6E7681]">
                    Pick a scenario on the left or type your own message to test.
                  </p>
                </div>
              )}
            </div>
          </div>

          {reply && (
            <div className="mt-4 flex items-center justify-between border-t border-[#30363D] pt-3 text-[11px] text-[#8B949E]">
              <span>Saved automatically to your history</span>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading}
                className="flex items-center gap-1 text-[#58A6FF] hover:underline disabled:opacity-50"
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
