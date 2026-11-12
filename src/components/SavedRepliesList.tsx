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
    <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#58A6FF]" />
          <h2 className="text-sm font-semibold text-white">Your Saved Reply History</h2>
          <span className="rounded-full bg-[#30363D] px-2 py-0.5 text-[11px] font-medium text-[#C9D1D9]">
            {replies.length}
          </span>
        </div>
        <span className="text-[11px] text-[#8B949E]">
          Protected by Supabase RLS
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#8B949E]">
            Loading your saved history...
          </div>
        ) : replies.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#8B949E]">
            <MessageSquare className="mx-auto h-7 w-7 text-[#484F58]" />
            <p className="mt-2 text-xs font-medium text-[#C9D1D9]">No replies saved yet</p>
            <p className="mt-1 text-[11px] text-[#6E7681]">
              Generate a reply above to automatically store it in your database.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {replies.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-[#30363D] bg-[#0D1117] p-3.5 transition hover:border-[#484F58]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[#21262D] px-2 py-0.5 text-[10px] font-medium uppercase text-[#7EE787]">
                      {item.tone}
                    </span>
                    <span className="text-[10px] text-[#8B949E]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[11px] italic text-[#8B949E]">
                    &quot;{item.customer_message}&quot;
                  </p>

                  <div className="mt-2.5 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#161B22] p-2.5 text-xs text-[#C9D1D9]">
                    {item.ai_response}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#21262D] pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.ai_response)}
                    className="flex items-center gap-1 text-[11px] text-[#58A6FF] hover:underline"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#7EE787]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-[#8B949E] transition hover:text-[#FF7B72]"
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
