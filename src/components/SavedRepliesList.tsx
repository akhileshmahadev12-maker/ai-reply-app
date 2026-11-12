"use client";

import { useState } from "react";
import { Clock, Trash2, Copy, Check, MessageSquare } from "lucide-react";

export interface SavedReply {
  id: string;
  customer_message: string;
  tone: string;
  ai_response: string;
  created_at: string;
}

interface SavedRepliesListProps {
  replies: SavedReply[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function SavedRepliesList({
  replies,
  loading,
  onDelete,
}: SavedRepliesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#71717A]" />
          <h2 className="text-sm font-semibold tracking-tight text-[#18181B]">
            Saved reply history
          </h2>
          <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 font-mono text-[11px] font-medium text-[#71717A]">
            {replies.length}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#A1A1AA]">
          Isolated by Supabase RLS
        </span>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#71717A]">
            Loading your saved history...
          </div>
        ) : replies.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#71717A]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#18181B]">
              No saved replies yet
            </p>
            <p className="mt-1 text-[11px] text-[#71717A]">
              Generate a reply above to automatically store it in your database.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {replies.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 transition hover:border-[#D4D4D8] hover:bg-white"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-white border border-[#E4E4E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#18181B]">
                      {item.tone}
                    </span>
                    <span className="font-mono text-[10px] text-[#A1A1AA]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[11px] text-[#71717A]">
                    &ldquo;{item.customer_message}&rdquo;
                  </p>

                  <div className="mt-3 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#E4E4E7] bg-white p-3 text-xs leading-relaxed text-[#27272A]">
                    {item.ai_response}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#E4E4E7] pt-2.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.ai_response)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18181B] hover:text-[#52525B]"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#71717A]" />
                        Copy text
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-[#A1A1AA] transition hover:text-[#E11D48] active:scale-[0.98]"
                    title="Delete reply"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
