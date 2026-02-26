"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";

export default function NewChatPage() {
  const router = useRouter();
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const chatId = `chat_${id}_${Date.now().toString(36)}`;
    router.replace(`/chat/${chatId}`);
  }, [router, id]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
    </div>
  );
}
