import React from "react";
import { Mail, Paperclip, Tag } from "lucide-react";

interface EmailData {
  id?: string;
  subject?: string;
  from?: string;
  to?: string | string[];
  date?: string;
  snippet?: string;
  body?: string;
  hasAttachments?: boolean;
  labels?: string[];
  labelIds?: string[];
  isUnread?: boolean;
  isStarred?: boolean;
}

interface GmailRendererProps {
  data: unknown;
}

function isEmailData(data: unknown): data is EmailData {
  return typeof data === "object" && data !== null && ("subject" in data || "from" in data || "snippet" in data);
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

function formatRecipients(to: string | string[] | undefined): string | null {
  if (!to) return null;
  if (Array.isArray(to)) return to.join(", ");
  return to;
}

const HIDDEN_LABELS = new Set(["INBOX", "UNREAD", "SENT", "DRAFT", "SPAM", "TRASH", "STARRED", "IMPORTANT"]);

function humanizeLabel(label: string): string {
  if (label.startsWith("CATEGORY_")) return label.slice(9).charAt(0) + label.slice(10).toLowerCase();
  return label;
}

function resolveLabels(email: EmailData): string[] {
  if (email.labels && email.labels.length > 0) return email.labels;
  if (email.labelIds && email.labelIds.length > 0) {
    return email.labelIds
      .filter((id) => !HIDDEN_LABELS.has(id))
      .map(humanizeLabel);
  }
  return [];
}

function EmailCard({ email }: { email: EmailData }) {
  const recipients = formatRecipients(email.to);
  const labels = resolveLabels(email);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {email.subject || "No subject"}
          </p>
          {email.from && (
            <p className="text-xs text-muted-foreground truncate">{email.from}</p>
          )}
          {recipients && (
            <p className="text-xs text-muted-foreground truncate">To: {recipients}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {email.hasAttachments && (
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {email.date && (
            <span className="text-xs text-muted-foreground">{formatRelativeDate(email.date)}</span>
          )}
        </div>
      </div>
      {labels.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {label}
            </span>
          ))}
        </div>
      )}
      {(email.snippet || email.body) && (
        <p className="text-xs text-muted-foreground line-clamp-3">
          {email.snippet || email.body}
        </p>
      )}
    </div>
  );
}

export function GmailRenderer({ data }: GmailRendererProps) {
  if (isEmailData(data)) {
    return <EmailCard email={data} />;
  }

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

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
