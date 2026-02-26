"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Puzzle, MessageSquare } from "lucide-react";

interface Integration {
  provider: string;
  status: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integrations")
      .then((res) => (res.ok ? res.json() : { integrations: [] }))
      .then((data) => setIntegrations(data.integrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = integrations.filter((i) => i.status === "active").length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your integrations and chat with AI using your connected services.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Integrations</h2>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-3xl font-semibold text-foreground">{activeCount}</span>
            )}
            <span className="text-sm text-muted-foreground">connected</span>
          </div>
          <Link
            href="/dashboard/integrations"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Manage integrations
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Chat</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Chat with AI using tools from your connected integrations.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Open Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
