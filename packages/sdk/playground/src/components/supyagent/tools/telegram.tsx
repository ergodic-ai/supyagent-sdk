import React from "react";
import { MessageSquare, User, Clock } from "lucide-react";

interface TelegramMessageData {
  message_id?: number;
  text?: string;
  from?: { username?: string; first_name?: string; last_name?: string };
  chat?: { title?: string; username?: string; type?: string };
  date?: number;
}

interface TelegramRendererProps {
  data: unknown;
}

function isTelegramMessage(data: unknown): data is TelegramMessageData {
  return typeof data === "object" && data !== null && ("text" in data || "message_id" in data);
}

function formatUnixDate(ts: number): string {
  try {
    const date = new Date(ts * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return String(ts);
  }
}

function MessageCard({ message }: { message: TelegramMessageData }) {
  const fromName = message.from
    ? [message.from.first_name, message.from.last_name].filter(Boolean).join(" ") || message.from.username
    : undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        {fromName && (
          <span className="flex items-center gap-1 text-xs font-medium text-foreground">
            <User className="h-3 w-3" />
            {fromName}
          </span>
        )}
        {message.chat?.title && (
          <span className="text-xs text-muted-foreground">{message.chat.title}</span>
        )}
        {message.date && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            {formatUnixDate(message.date)}
          </span>
        )}
      </div>
      {message.text && (
        <p className="text-sm text-foreground line-clamp-3">{message.text}</p>
      )}
    </div>
  );
}

export function TelegramRenderer({ data }: TelegramRendererProps) {
  // {messages: [...]}
  if (typeof data === "object" && data !== null && "messages" in data) {
    const msgs = (data as any).messages;
    if (Array.isArray(msgs)) {
      return (
        <div className="space-y-2">
          {msgs.filter(isTelegramMessage).map((m, i) => <MessageCard key={m.message_id || i} message={m} />)}
        </div>
      );
    }
  }

  // {result: [...]} (Bot API shape)
  if (typeof data === "object" && data !== null && "result" in data) {
    const result = (data as any).result;
    if (Array.isArray(result)) {
      const msgs = result.filter(isTelegramMessage);
      if (msgs.length > 0) {
        return (
          <div className="space-y-2">
            {msgs.map((m, i) => <MessageCard key={m.message_id || i} message={m} />)}
          </div>
        );
      }
    }
  }

  if (isTelegramMessage(data)) return <MessageCard message={data} />;

  if (Array.isArray(data)) {
    const msgs = data.filter(isTelegramMessage);
    if (msgs.length > 0) {
      return (
        <div className="space-y-2">
          {msgs.map((m, i) => <MessageCard key={m.message_id || i} message={m} />)}
        </div>
      );
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
