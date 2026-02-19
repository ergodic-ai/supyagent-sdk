"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

interface ChatSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentChatId: string;
}

export function ChatSidebar({ currentChatId }: ChatSidebarProps) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);

  useEffect(() => {
    fetch("/api/chats")
      .then((res) => res.json())
      .then((data) => setChats(data.chats || []))
      .catch(() => {});
  }, [currentChatId]);

  const deleteChat = async (id: string) => {
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === currentChatId) {
      router.push("/chat");
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-zinc-300">Chats</span>
        <button
          onClick={() => router.push("/chat")}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group mb-1 flex items-center rounded-lg px-3 py-2 cursor-pointer transition-colors ${
              chat.id === currentChatId
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
            }`}
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <MessageSquare className="mr-2 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate text-sm">{chat.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
              className="ml-1 hidden rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 group-hover:block"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
