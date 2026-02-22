"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  ExternalLink,
  Mail,
  Calendar,
  HardDrive,
  MessageSquare,
  Github,
  type LucideIcon,
  FileText,
  CreditCard,
  SquareKanban,
  Cloud,
  CalendarClock,
  Phone,
  MessageCircle,
  UserCircle,
  Monitor,
  Send,
  CircleDot,
  Briefcase,
  Users,
  Bell,
} from "lucide-react";

interface UserInfo {
  email: string | null;
  tier: string;
  usage: { current: number; limit: number };
  integrations: Array<{ provider: string; status: string }>;
  dashboardUrl: string;
}

const PROVIDER_ICONS: Record<string, LucideIcon> = {
  google: Mail,
  slack: MessageSquare,
  github: Github,
  discord: MessageSquare,
  microsoft: Monitor,
  twitter: MessageCircle,
  linkedin: UserCircle,
  notion: FileText,
  telegram: Send,
  hubspot: Users,
  whatsapp: MessageCircle,
  stripe: CreditCard,
  jira: SquareKanban,
  salesforce: Cloud,
  calendly: CalendarClock,
  twilio: Phone,
  linear: CircleDot,
  pipedrive: Briefcase,
  resend: Send,
  inbox: Bell,
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  slack: "Slack",
  github: "GitHub",
  discord: "Discord",
  microsoft: "Microsoft",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  notion: "Notion",
  telegram: "Telegram",
  hubspot: "HubSpot",
  whatsapp: "WhatsApp",
  stripe: "Stripe",
  jira: "Jira",
  salesforce: "Salesforce",
  calendly: "Calendly",
  twilio: "Twilio",
  linear: "Linear",
  pipedrive: "Pipedrive",
  resend: "Resend",
  inbox: "Inbox",
};

export function UserButton() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {});
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) {
    return (
      <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
    );
  }

  const initial = (user.email?.[0] || "?").toUpperCase();
  const usagePercent =
    user.usage.limit > 0
      ? Math.min(100, Math.round((user.usage.current / user.usage.limit) * 100))
      : 0;
  const isUnlimited = user.usage.limit === -1;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
          {initial}
        </div>
        <span className="hidden sm:inline text-xs">{user.email}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-border bg-card shadow-lg">
          {/* Profile */}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.email}
                </p>
                <span className="inline-block mt-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {user.tier}
                </span>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>API usage this month</span>
              <span>
                {user.usage.current.toLocaleString()}
                {isUnlimited ? "" : ` / ${user.usage.limit.toLocaleString()}`}
              </span>
            </div>
            {!isUnlimited && (
              <div className="mt-1.5 h-1 w-full rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-foreground/40 transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Integrations */}
          {user.integrations.length > 0 && (
            <div className="border-b border-border px-4 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Connected integrations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.integrations.map((integration) => {
                  const Icon = PROVIDER_ICONS[integration.provider] || User;
                  const label =
                    PROVIDER_LABELS[integration.provider] ||
                    integration.provider;
                  return (
                    <div
                      key={integration.provider}
                      className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1"
                      title={label}
                    >
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dashboard link */}
          <div className="px-4 py-2.5">
            <a
              href={user.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
