import React from "react";
import { MessageCircle, User, Clock } from "lucide-react";

interface WhatsAppMessageData {
  id?: string;
  from?: string;
  to?: string;
  body?: string;
  text?: string;
  timestamp?: number | string;
  type?: string;
  status?: string;
  contact_name?: string;
  profile_name?: string;
}

interface WhatsAppFormatterProps {
  data: unknown;
}

function isWhatsAppMessage(data: unknown): data is WhatsAppMessageData {
  return typeof data === "object" && data !== null && ("body" in data || "text" in data || "from" in data);
}

function formatTimestamp(ts: number | string): string {
  try {
    const date = typeof ts === "number"
      ? new Date(ts > 1e12 ? ts : ts * 1000)
      : new Date(ts);
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

function MessageCard({ message }: { message: WhatsAppMessageData }) {
  const sender = message.profile_name || message.contact_name || message.from;
  const body = message.body || message.text;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        {sender && (
          <span className="flex items-center gap-1 text-xs font-medium text-foreground">
            <User className="h-3 w-3" />
            {sender}
          </span>
        )}
        {message.type && message.type !== "text" && (
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {message.type}
          </span>
        )}
        {message.status && (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
            message.status === "delivered" || message.status === "read"
              ? "text-green-500 bg-green-500/10"
              : "text-muted-foreground bg-muted"
          }`}>
            {message.status}
          </span>
        )}
        {message.timestamp && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
      {body && (
        <p className="text-sm text-foreground line-clamp-3">{body}</p>
      )}
    </div>
  );
}

export function WhatsAppFormatter({ data }: WhatsAppFormatterProps) {
  // {messages: [...]}
  if (typeof data === "object" && data !== null && "messages" in data) {
    const msgs = (data as any).messages;
    if (Array.isArray(msgs)) {
      return (
        <div className="space-y-2">
          {msgs.filter(isWhatsAppMessage).map((m, i) => <MessageCard key={m.id || i} message={m} />)}
        </div>
      );
    }
  }

  // Single message
  if (isWhatsAppMessage(data)) return <MessageCard message={data} />;

  // Array of messages
  if (Array.isArray(data)) {
    const msgs = data.filter(isWhatsAppMessage);
    if (msgs.length > 0) {
      return (
        <div className="space-y-2">
          {msgs.map((m, i) => <MessageCard key={m.id || i} message={m} />)}
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
