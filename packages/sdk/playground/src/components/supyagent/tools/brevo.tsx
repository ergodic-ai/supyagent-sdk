import React from "react";
import { User, Mail, BarChart3 } from "lucide-react";

interface BrevoContactData {
  id?: number;
  email?: string;
  attributes?: { FIRSTNAME?: string; LASTNAME?: string; [key: string]: unknown };
}

interface BrevoCampaignData {
  id?: number;
  name?: string;
  subject?: string;
  status?: string;
  statistics?: {
    globalStats?: { opened?: number; clicked?: number; sent?: number };
  };
}

interface BrevoRendererProps {
  data: unknown;
}

function isBrevoContact(data: unknown): data is BrevoContactData {
  return typeof data === "object" && data !== null && "email" in data && ("attributes" in data || "id" in data);
}

function isBrevoCampaign(data: unknown): data is BrevoCampaignData {
  return typeof data === "object" && data !== null && "name" in data && ("subject" in data || "status" in data);
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-green-500/10 text-green-500",
  draft: "bg-muted text-muted-foreground",
  queued: "bg-blue-500/10 text-blue-500",
  suspended: "bg-yellow-500/10 text-yellow-600",
  archive: "bg-muted text-muted-foreground",
};

function ContactCard({ contact }: { contact: BrevoContactData }) {
  const name = contact.attributes
    ? [contact.attributes.FIRSTNAME, contact.attributes.LASTNAME].filter(Boolean).join(" ")
    : undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {name && <p className="text-sm font-medium text-foreground">{name}</p>}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {contact.email}
          </p>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: BrevoCampaignData }) {
  const stats = campaign.statistics?.globalStats;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{campaign.name}</p>
          {campaign.subject && <p className="text-xs text-muted-foreground">{campaign.subject}</p>}
        </div>
        {campaign.status && (
          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[campaign.status] || "bg-muted text-muted-foreground"}`}>
            {campaign.status}
          </span>
        )}
      </div>
      {stats && (
        <div className="flex items-center gap-4 pl-6">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            {stats.sent ?? 0} sent
          </span>
          {stats.opened !== undefined && (
            <span className="text-xs text-muted-foreground">{stats.opened} opened</span>
          )}
          {stats.clicked !== undefined && (
            <span className="text-xs text-muted-foreground">{stats.clicked} clicked</span>
          )}
        </div>
      )}
    </div>
  );
}

export function BrevoRenderer({ data }: BrevoRendererProps) {
  // {contacts: [...]}
  if (typeof data === "object" && data !== null && "contacts" in data) {
    const contacts = (data as any).contacts;
    if (Array.isArray(contacts)) {
      return (
        <div className="space-y-1.5">
          {contacts.filter(isBrevoContact).map((c, i) => <ContactCard key={c.id || i} contact={c} />)}
        </div>
      );
    }
  }

  // {campaigns: [...]}
  if (typeof data === "object" && data !== null && "campaigns" in data) {
    const campaigns = (data as any).campaigns;
    if (Array.isArray(campaigns)) {
      return (
        <div className="space-y-1.5">
          {campaigns.filter(isBrevoCampaign).map((c, i) => <CampaignCard key={c.id || i} campaign={c} />)}
        </div>
      );
    }
  }

  if (isBrevoContact(data)) return <ContactCard contact={data} />;
  if (isBrevoCampaign(data)) return <CampaignCard campaign={data} />;

  if (Array.isArray(data)) {
    const contacts = data.filter(isBrevoContact);
    if (contacts.length > 0) {
      return <div className="space-y-1.5">{contacts.map((c, i) => <ContactCard key={c.id || i} contact={c} />)}</div>;
    }
    const campaigns = data.filter(isBrevoCampaign);
    if (campaigns.length > 0) {
      return <div className="space-y-1.5">{campaigns.map((c, i) => <CampaignCard key={c.id || i} campaign={c} />)}</div>;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
