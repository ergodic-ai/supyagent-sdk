import React from "react";
import { Calendar, MapPin, Users } from "lucide-react";

interface CalendarEventData {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  attendees?: Array<{ email?: string; displayName?: string }>;
  status?: string;
}

interface CalendarEventFormatterProps {
  data: unknown;
}

function isCalendarEvent(data: unknown): data is CalendarEventData {
  return typeof data === "object" && data !== null && ("summary" in data || "start" in data);
}

function formatDateTime(dt?: { dateTime?: string; date?: string }): string {
  if (!dt) return "";
  const raw = dt.dateTime || dt.date;
  if (!raw) return "";
  try {
    const date = new Date(raw);
    return dt.dateTime
      ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : date.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return raw;
  }
}

function EventCard({ event }: { event: CalendarEventData }) {
  const startStr = formatDateTime(event.start);
  const endStr = formatDateTime(event.end);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Calendar className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">
            {event.summary || "Untitled event"}
          </p>
          {startStr && (
            <p className="text-xs text-zinc-400">
              {startStr}
              {endStr ? ` → ${endStr}` : ""}
            </p>
          )}
        </div>
      </div>
      {event.location && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
      {event.attendees && event.attendees.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Users className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {event.attendees.map((a) => a.displayName || a.email).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

export function CalendarEventFormatter({ data }: CalendarEventFormatterProps) {
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
    <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
