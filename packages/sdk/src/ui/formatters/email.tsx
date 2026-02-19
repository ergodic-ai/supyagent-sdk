import React from "react";
import { Mail, Paperclip } from "lucide-react";

interface EmailData {
  id?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  snippet?: string;
  body?: string;
  hasAttachments?: boolean;
  labels?: string[];
}

interface EmailFormatterProps {
  data: unknown;
}

function isEmailData(data: unknown): data is EmailData {
  return typeof data === "object" && data !== null && ("subject" in data || "from" in data || "snippet" in data);
}

function EmailCard({ email }: { email: EmailData }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {email.subject || "No subject"}
          </p>
          {email.from && (
            <p className="text-xs text-zinc-400 truncate">{email.from}</p>
          )}
        </div>
        {email.hasAttachments && (
          <Paperclip className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
      </div>
      {email.snippet && (
        <p className="text-xs text-zinc-400 line-clamp-2">{email.snippet}</p>
      )}
      {email.date && (
        <p className="text-xs text-zinc-500">{email.date}</p>
      )}
    </div>
  );
}

export function EmailFormatter({ data }: EmailFormatterProps) {
  // Single email
  if (isEmailData(data)) {
    return <EmailCard email={data} />;
  }

  // Array of emails (list response)
  if (Array.isArray(data)) {
    const emails = data.filter(isEmailData);
    if (emails.length > 0) {
      return (
        <div className="space-y-2">
          {emails.map((email, i) => (
            <EmailCard key={email.id || i} email={email} />
          ))}
        </div>
      );
    }
  }

  // Object with messages array
  if (typeof data === "object" && data !== null && "messages" in data) {
    const messages = (data as { messages: unknown[] }).messages;
    if (Array.isArray(messages)) {
      const emails = messages.filter(isEmailData);
      if (emails.length > 0) {
        return (
          <div className="space-y-2">
            {emails.map((email, i) => (
              <EmailCard key={email.id || i} email={email} />
            ))}
          </div>
        );
      }
    }
  }

  // Fallback to raw
  return (
    <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
