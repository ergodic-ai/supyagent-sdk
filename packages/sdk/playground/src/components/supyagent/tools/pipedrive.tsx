import React from "react";
import { Briefcase, DollarSign } from "lucide-react";

interface PipedriveDealData {
  id?: number;
  title?: string;
  value?: number;
  currency?: string;
  status?: string;
  stage_id?: number;
  stage_name?: string;
  person_name?: string;
  org_name?: string;
  owner_name?: string;
}

interface PipedriveRendererProps {
  data: unknown;
}

function isPipedriveDeal(data: unknown): data is PipedriveDealData {
  return typeof data === "object" && data !== null && ("title" in data || "value" in data || "status" in data) && !("subject" in data);
}

function formatCurrency(value: number, currency?: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "$"}${value.toLocaleString()}`;
  }
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "won":
      return { label: "Won", className: "text-green-500 bg-green-500/10" };
    case "lost":
      return { label: "Lost", className: "text-destructive bg-destructive/10" };
    case "open":
      return { label: "Open", className: "text-primary bg-primary/10" };
    case "deleted":
      return { label: "Deleted", className: "text-muted-foreground bg-muted" };
    default:
      return status ? { label: status, className: "text-muted-foreground bg-muted" } : null;
  }
}

function DealCard({ deal }: { deal: PipedriveDealData }) {
  const statusBadge = getStatusBadge(deal.status);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{deal.title || "Untitled deal"}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {deal.value !== undefined && (
              <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(deal.value, deal.currency)}
              </span>
            )}
            {statusBadge && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs text-muted-foreground">
        {deal.person_name && <span>{deal.person_name}</span>}
        {deal.org_name && <span>{deal.org_name}</span>}
        {deal.stage_name && <span>{deal.stage_name}</span>}
      </div>
    </div>
  );
}

export function PipedriveRenderer({ data }: PipedriveRendererProps) {
  if (isPipedriveDeal(data)) {
    return <DealCard deal={data} />;
  }

  if (Array.isArray(data)) {
    const deals = data.filter(isPipedriveDeal);
    if (deals.length > 0) {
      return (
        <div className="space-y-2">
          {deals.map((deal, i) => (
            <DealCard key={deal.id || i} deal={deal} />
          ))}
        </div>
      );
    }
  }

  // Supyagent API shape: { deals: [...], pagination }
  if (typeof data === "object" && data !== null && "deals" in data) {
    const items = (data as any).deals;
    if (Array.isArray(items)) {
      const deals = items.filter(isPipedriveDeal);
      if (deals.length > 0) {
        return (
          <div className="space-y-2">
            {deals.map((deal, i) => (
              <DealCard key={deal.id || i} deal={deal} />
            ))}
          </div>
        );
      }
    }
  }

  // Single deal wrapper: { deal: {...} }
  if (typeof data === "object" && data !== null && "deal" in data) {
    const item = (data as any).deal;
    if (isPipedriveDeal(item)) {
      return <DealCard deal={item} />;
    }
  }

  // Raw Pipedrive shape: { data: [...] }
  if (typeof data === "object" && data !== null && "data" in data) {
    const items = (data as any).data;
    if (Array.isArray(items)) {
      const deals = items.filter(isPipedriveDeal);
      if (deals.length > 0) {
        return (
          <div className="space-y-2">
            {deals.map((deal, i) => (
              <DealCard key={deal.id || i} deal={deal} />
            ))}
          </div>
        );
      }
    }
    if (isPipedriveDeal(items)) {
      return <DealCard deal={items} />;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
