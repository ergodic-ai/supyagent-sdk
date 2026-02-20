"use client";

import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

interface ChatInputProps {
  sendMessage: (message: { text: string }) => Promise<void>;
  isLoading: boolean;
  stop: () => void;
}

export function ChatInput({ sendMessage, isLoading, stop }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end rounded-xl border border-zinc-800 bg-zinc-900 focus-within:border-zinc-700"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Send a message..."
        rows={1}
        className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
              handleSubmit(e as unknown as FormEvent);
            }
          }
        }}
      />
      <div className="p-2">
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
