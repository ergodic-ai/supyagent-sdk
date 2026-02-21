import React from "react";
import { Calendar, MapPin, Users, Check, X, HelpCircle } from "lucide-react";

interface CalendarEventData {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  status?: string;
}

interface CalendarRendererProps {
  data: unknown;
}

function isCalendarEvent(data: unknown): data is CalendarEventData {
  return typeof data === "object" && data !== null && ("summary" in data || "start" in data);
}

function formatRelativeDateTime(dt?: { dateTime?: string; date?: string }): string {
  if (!dt) return "";
  const raw = dt.dateTime || dt.date;
  if (!raw) return "";
  try {
    const date = new Date(raw);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    const timeStr = dt.dateTime
      ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : "";

    if (diffDays === 0) {
      return timeStr ? `Today at ${timeStr}` : "Today";
    }
    if (diffDays === 1) {
      return timeStr ? `Tomorrow at ${timeStr}` : "Tomorrow";
    }
    if (diffDays === -1) {
      return timeStr ? `Yesterday at ${timeStr}` : "Yesterday";
    }
    if (diffDays > 1 && diffDays < 7) {
      const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
      return timeStr ? `${dayName} at ${timeStr}` : dayName;
    }

    return dt.dateTime
      ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : date.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return raw;
  }
}

function ResponseStatusIcon({ status }: { status?: string }) {
  switch (status) {
    case "accepted":
      return <Check className="h-3 w-3 text-green-500" />;
    case "declined":
      return <X className="h-3 w-3 text-destructive" />;
    case "tentative":
      return <HelpCircle className="h-3 w-3 text-yellow-500" />;
    default:
      return <HelpCircle className="h-3 w-3 text-muted-foreground" />;
  }
}

function EventCard({ event }: { event: CalendarEventData }) {
  const startStr = formatRelativeDateTime(event.start);
  const endStr = formatRelativeDateTime(event.end);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {event.summary || "Untitled event"}
          </p>
          {startStr && (
            <p className="text-xs text-muted-foreground">
              {startStr}
              {endStr ? ` \u2192 ${endStr}` : ""}
            </p>
          )}
        </div>
      </div>
      {event.location && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
      {event.attendees && event.attendees.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3 shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {event.attendees.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <ResponseStatusIcon status={a.responseStatus} />
                {a.displayName || a.email}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarRenderer({ data }: CalendarRendererProps) {
  if (isCalendarEvent(data)) {
    return <EventCard event={data} />;
  }

  if (Array.isArray(data)) {
    const events = data.filter(isCalendarEvent);
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
    const events = (data as { events: unknown[] }).events;
    if (Array.isArray(events)) {
      const calEvents = events.filter(isCalendarEvent);
      if (calEvents.length > 0) {
        return (
          <div className="space-y-2">
            {calEvents.map((event, i) => (
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
