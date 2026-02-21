"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2, Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentChatId: string;
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "Previous 7 days";
  if (diffDays < 30) return "Previous 30 days";
  return "Older";
}

export function ChatSidebar({ currentChatId }: ChatSidebarProps) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

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

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, search]);

  const groupedChats = useMemo(() => {
    const groups: Record<string, ChatSummary[]> = {};
    const order = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"];

    for (const chat of filteredChats) {
      const group = getDateGroup(chat.updatedAt || chat.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(chat);
    }

    return order
      .filter((g) => groups[g]?.length)
      .map((g) => ({ label: g, chats: groups[g] }));
  }, [filteredChats]);

  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-border bg-card py-3 gap-2">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push("/chat")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-foreground">Chats</span>
        <button
          onClick={() => router.push("/chat")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {groupedChats.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 py-1 text-xs font-medium text-muted-foreground">
              {group.label}
            </p>
            {group.chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group mb-0.5 flex items-center rounded-lg px-3 py-2 cursor-pointer transition-colors",
                  chat.id === currentChatId
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => router.push(`/chat/${chat.id}`)}
              >
                <MessageSquare className="mr-2 h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate text-sm">{chat.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="ml-1 hidden rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
