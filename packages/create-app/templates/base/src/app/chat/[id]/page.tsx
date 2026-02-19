"use client";

import { use, useEffect, useState } from "react";
import { Chat } from "@/components/chat";

interface ChatMessage {
  id: string;
  role: string;
  parts: Array<{ type: string; [key: string]: unknown }>;
  metadata?: Record<string, unknown>;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | null>(null);

  useEffect(() => {
    fetch(`/api/chats/${id}`)
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data) => setInitialMessages(data.messages || []))
      .catch(() => setInitialMessages([]));
  }, [id]);

  if (initialMessages === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  return <Chat chatId={id} initialMessages={initialMessages} />;
}
