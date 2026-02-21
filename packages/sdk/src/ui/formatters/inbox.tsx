import React from "react";
import { Bell, Calendar, Mail, MessageSquare } from "lucide-react";

interface InboxEventData {
  id?: string;
  /** Legacy fields */
  type?: string;
  title?: string;
  description?: string;
  source?: string;
  timestamp?: string;
  created_at?: string;
  read?: boolean;
  /** Actual API fields */
  event_type?: string;
  summary?: string;
  provider?: string;
  status?: string;
  received_at?: string;
  updated_at?: string;
  payload?: Record<string, unknown>;
}

interface InboxFormatterProps {
  data: unknown;
}

function isInboxEvent(data: unknown): data is InboxEventData {
  if (typeof data !== "object" || data === null) return false;
  // Actual API shape
  if ("event_type" in data || "summary" in data) return true;
  // Legacy/mock shape
  if ("title" in data || ("type" in data && "source" in data)) return true;
  return false;
}

function resolveEventType(event: InboxEventData): string | undefined {
  if (event.event_type) {
    // "email.received" → "email", "message" → "message"
    return event.event_type.split(".")[0];
  }
  return event.type;
}

function getEventIcon(type?: string) {
  switch (type) {
    case "email":
      return Mail;
    case "message":
      return MessageSquare;
    case "calendar":
      return Calendar;
    default:
      return Bell;
  }
}

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function EventCard({ event }: { event: InboxEventData }) {
  const eventType = resolveEventType(event);
  const Icon = getEventIcon(eventType);
  const timestamp = event.received_at || event.timestamp || event.created_at;
  const title = event.summary || event.title;
  const source = event.provider || event.source;
  const snippet = event.description || (event.payload?.snippet as string) || (event.payload?.text as string);
  const isUnread = event.status === "unread" || event.read === false;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {eventType && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                {eventType}
              </span>
            )}
            {source && (
              <span className="text-xs text-muted-foreground capitalize">{source}</span>
            )}
            {isUnread && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            )}
            {timestamp && (
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {formatTimestamp(timestamp)}
              </span>
            )}
          </div>
          {title && (
            <p className="text-sm font-medium text-foreground mt-1 line-clamp-1">{title}</p>
          )}
        </div>
      </div>
      {snippet && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{snippet}</p>
      )}
    </div>
  );
}

export function InboxFormatter({ data }: InboxFormatterProps) {
  if (isInboxEvent(data)) {
    return <EventCard event={data} />;
  }

  if (Array.isArray(data)) {
    const events = data.filter(isInboxEvent);
    if (events.length > 0) {
      return (
        <div className="space-y-2">
          {events.map((event, i) => (
            <EventCard key={event.id || i} event={event} />
          ))}
        </div>
      );
    }
  }

  if (typeof data === "object" && data !== null && "events" in data) {
    const events = (data as any).events;
    if (Array.isArray(events)) {
      const inboxEvents = events.filter(isInboxEvent);
      if (inboxEvents.length > 0) {
        return (
          <div className="space-y-2">
            {inboxEvents.map((event, i) => (
              <EventCard key={event.id || i} event={event} />
            ))}
          </div>
        );
      }
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
