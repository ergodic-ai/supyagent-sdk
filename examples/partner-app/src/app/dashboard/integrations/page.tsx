"use client";

import { useEffect, useState, useCallback } from "react";
import { IntegrationCard } from "@/components/integration-card";

interface Integration {
  provider: string;
  status: string;
  connectedAt?: string;
}

const PROVIDERS = [
  { id: "google", name: "Google", description: "Gmail, Calendar, Drive" },
  { id: "slack", name: "Slack", description: "Messages & channels" },
  { id: "github", name: "GitHub", description: "Repos, issues & PRs" },
  { id: "discord", name: "Discord", description: "Servers & messages" },
  { id: "microsoft", name: "Microsoft", description: "Outlook, Calendar, OneDrive" },
  { id: "notion", name: "Notion", description: "Pages & databases" },
  { id: "linear", name: "Linear", description: "Issues & projects" },
  { id: "hubspot", name: "HubSpot", description: "CRM & contacts" },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(() => {
    fetch("/api/integrations")
      .then((res) => (res.ok ? res.json() : { integrations: [] }))
      .then((data) => setIntegrations(data.integrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your services to give AI access to your tools.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((provider) => {
            const integration = integrations.find((i) => i.provider === provider.id);
            return (
              <IntegrationCard
                key={provider.id}
                provider={provider.id}
                name={provider.name}
                description={provider.description}
                status={integration?.status}
                onStatusChange={fetchIntegrations}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
