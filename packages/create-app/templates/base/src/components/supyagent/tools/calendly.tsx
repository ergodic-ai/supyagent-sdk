import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";

interface CalendlyEventData {
  uri?: string;
  name?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  location?: { type?: string; location?: string };
  event_type?: string;
}

interface CalendlyEventTypeData {
  uri?: string;
  name?: string;
  duration?: number;
  active?: boolean;
  slug?: string;
  description_plain?: string;
}

interface CalendlyRendererProps {
  data: unknown;
}

function isCalendlyEvent(data: unknown): data is CalendlyEventData {
  return typeof data === "object" && data !== null && "name" in data && ("start_time" in data || "status" in data);
}

function isCalendlyEventType(data: unknown): data is CalendlyEventTypeData {
  return typeof data === "object" && data !== null && "name" in data && ("duration" in data || "slug" in data || "active" in data);
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/10 text-green-500",
  canceled: "bg-destructive/10 text-destructive",
};

function EventCard({ event }: { event: CalendlyEventData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{event.name}</p>
          {event.start_time && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDateTime(event.start_time)}
              {event.end_time && ` - ${formatDateTime(event.end_time)}`}
            </p>
          )}
          {event.location?.location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {event.location.location}
            </p>
          )}
        </div>
        {event.status && (
          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[event.status] || "bg-muted text-muted-foreground"}`}>
            {event.status}
          </span>
        )}
      </div>
    </div>
  );
}

function EventTypeCard({ eventType }: { eventType: CalendlyEventTypeData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{eventType.name}</p>
          {eventType.description_plain && (
            <p className="text-xs text-muted-foreground line-clamp-2">{eventType.description_plain}</p>
          )}
          {eventType.duration !== undefined && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {eventType.duration} min
            </p>
          )}
        </div>
        {eventType.active !== undefined && (
          <span className={`rounded-full px-2 py-0.5 text-xs ${eventType.active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
            {eventType.active ? "Active" : "Inactive"}
          </span>
        )}
      </div>
    </div>
  );
}

export function CalendlyRenderer({ data }: CalendlyRendererProps) {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;

    // {collection: [...]}
    if (Array.isArray(d.collection)) {
      const events = d.collection.filter(isCalendlyEvent);
      const types = d.collection.filter(isCalendlyEventType);
      if (types.length > 0 && events.length === 0) {
        return <div className="space-y-1.5">{types.map((t, i) => <EventTypeCard key={t.uri || i} eventType={t} />)}</div>;
      }
      if (events.length > 0) {
        return <div className="space-y-1.5">{events.map((e, i) => <EventCard key={e.uri || i} event={e} />)}</div>;
      }
    }

    // {scheduled_events: [...]}
    if (Array.isArray(d.scheduled_events)) {
      return (
        <div className="space-y-1.5">
          {d.scheduled_events.filter(isCalendlyEvent).map((e: CalendlyEventData, i: number) => <EventCard key={e.uri || i} event={e} />)}
        </div>
      );
    }

    // {event_types: [...]}
    if (Array.isArray(d.event_types)) {
      return (
        <div className="space-y-1.5">
          {d.event_types.filter(isCalendlyEventType).map((t: CalendlyEventTypeData, i: number) => <EventTypeCard key={t.uri || i} eventType={t} />)}
        </div>
      );
    }
  }

  if (isCalendlyEvent(data)) return <EventCard event={data} />;
  if (isCalendlyEventType(data)) return <EventTypeCard eventType={data} />;

  if (Array.isArray(data)) {
    const events = data.filter(isCalendlyEvent);
    if (events.length > 0) {
      return <div className="space-y-1.5">{events.map((e, i) => <EventCard key={e.uri || i} event={e} />)}</div>;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
