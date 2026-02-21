import React from "react";
import { Send, Clock } from "lucide-react";

interface ResendEmailData {
  id?: string;
  to?: string | string[];
  from?: string;
  subject?: string;
  created_at?: string;
  last_event?: string;
}

interface ResendRendererProps {
  data: unknown;
}

function isResendData(data: unknown): data is ResendEmailData {
  return typeof data === "object" && data !== null && ("id" in data || "to" in data) && ("subject" in data || "from" in data || "created_at" in data);
}

function formatRecipients(to: string | string[] | undefined): string {
  if (!to) return "Unknown";
  if (Array.isArray(to)) return to.join(", ");
  return to;
}

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return dateStr;
  }
}

function ResendCard({ email }: { email: ResendEmailData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 shrink-0">
          <Send className="h-4 w-4 text-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Email sent</p>
          {email.subject && (
            <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
          )}
        </div>
      </div>
      <div className="pl-10 space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="text-foreground">To:</span> {formatRecipients(email.to)}
        </p>
        {email.from && (
          <p>
            <span className="text-foreground">From:</span> {email.from}
          </p>
        )}
        {email.created_at && (
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(email.created_at)}
          </p>
        )}
        {email.last_event && (
          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
            {email.last_event}
          </span>
        )}
      </div>
    </div>
  );
}

export function ResendRenderer({ data }: ResendRendererProps) {
  if (isResendData(data)) {
    return <ResendCard email={data} />;
  }

  if (typeof data === "object" && data !== null && "data" in data) {
    const inner = (data as any).data;
    if (isResendData(inner)) {
      return <ResendCard email={inner} />;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
