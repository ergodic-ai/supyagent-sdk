import React from "react";
import { Phone, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

interface TwilioMessageData {
  sid?: string;
  from?: string;
  to?: string;
  body?: string;
  status?: string;
  direction?: string;
  date_sent?: string;
  date_created?: string;
}

interface TwilioFormatterProps {
  data: unknown;
}

function isTwilioMessage(data: unknown): data is TwilioMessageData {
  return typeof data === "object" && data !== null && ("body" in data || "sid" in data) && ("from" in data || "to" in data);
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
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
    return dateStr;
  }
}

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-green-500/10 text-green-500",
  sent: "bg-green-500/10 text-green-500",
  received: "bg-blue-500/10 text-blue-500",
  failed: "bg-destructive/10 text-destructive",
  undelivered: "bg-destructive/10 text-destructive",
  queued: "bg-yellow-500/10 text-yellow-600",
  sending: "bg-blue-500/10 text-blue-500",
};

function MessageCard({ message }: { message: TwilioMessageData }) {
  const isInbound = message.direction?.includes("inbound");
  const DirectionIcon = isInbound ? ArrowDownLeft : ArrowUpRight;
  const dateStr = message.date_sent || message.date_created;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
        <DirectionIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {message.from && <span className="text-xs text-muted-foreground">{message.from}</span>}
          <span className="text-xs text-muted-foreground">→</span>
          {message.to && <span className="text-xs text-muted-foreground">{message.to}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {message.status && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[message.status] || "bg-muted text-muted-foreground"}`}>
              {message.status}
            </span>
          )}
          {dateStr && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(dateStr)}
            </span>
          )}
        </div>
      </div>
      {message.body && (
        <p className="text-sm text-foreground line-clamp-3">{message.body}</p>
      )}
    </div>
  );
}

export function TwilioFormatter({ data }: TwilioFormatterProps) {
  // {messages: [...]}
  if (typeof data === "object" && data !== null && "messages" in data) {
    const msgs = (data as any).messages;
    if (Array.isArray(msgs)) {
      return (
        <div className="space-y-1.5">
          {msgs.filter(isTwilioMessage).map((m, i) => <MessageCard key={m.sid || i} message={m} />)}
        </div>
      );
    }
  }

  if (isTwilioMessage(data)) return <MessageCard message={data} />;

  if (Array.isArray(data)) {
    const msgs = data.filter(isTwilioMessage);
    if (msgs.length > 0) {
      return (
        <div className="space-y-1.5">
          {msgs.map((m, i) => <MessageCard key={m.sid || i} message={m} />)}
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
