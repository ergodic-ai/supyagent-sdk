"use client";

import { use, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { Chat } from "@/components/chat";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);

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

  return <Chat key={id} chatId={id} initialMessages={initialMessages} />;
}
