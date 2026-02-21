import React from "react";
import { User, Briefcase, Mail, Phone, Building2, Calendar } from "lucide-react";

interface SalesforceContactData {
  Id?: string;
  Name?: string;
  Title?: string;
  Email?: string;
  Phone?: string;
  Account?: { Name?: string } | null;
  AccountName?: string;
}

interface SalesforceOpportunityData {
  Id?: string;
  Name?: string;
  Amount?: number;
  StageName?: string;
  CloseDate?: string;
  Probability?: number;
}

interface SalesforceRendererProps {
  data: unknown;
}

function isContact(data: unknown): data is SalesforceContactData {
  if (typeof data !== "object" || data === null) return false;
  return "Name" in data && ("Email" in data || "Phone" in data || "Title" in data);
}

function isOpportunity(data: unknown): data is SalesforceOpportunityData {
  if (typeof data !== "object" || data === null) return false;
  return "Name" in data && ("StageName" in data || "Amount" in data || "CloseDate" in data);
}

function ContactCard({ contact }: { contact: SalesforceContactData }) {
  const account = contact.AccountName || contact.Account?.Name;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{contact.Name}</p>
          {contact.Title && <p className="text-xs text-muted-foreground">{contact.Title}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6">
        {contact.Email && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {contact.Email}
          </span>
        )}
        {contact.Phone && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {contact.Phone}
          </span>
        )}
        {account && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {account}
          </span>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ opp }: { opp: SalesforceOpportunityData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{opp.Name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {opp.Amount !== undefined && (
              <span className="text-xs font-medium text-foreground">
                {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(opp.Amount)}
              </span>
            )}
            {opp.StageName && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {opp.StageName}
              </span>
            )}
            {opp.CloseDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {opp.CloseDate}
              </span>
            )}
          </div>
        </div>
      </div>
      {opp.Probability !== undefined && (
        <div className="pl-6 space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Probability</span>
            <span className="text-xs font-medium text-foreground">{opp.Probability}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, opp.Probability)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SalesforceRenderer({ data }: SalesforceRendererProps) {
  // {records: [...]}
  if (typeof data === "object" && data !== null && "records" in data) {
    const records = (data as any).records;
    if (Array.isArray(records)) {
      const contacts = records.filter(isContact);
      const opps = records.filter(isOpportunity);
      if (opps.length > 0 && contacts.length === 0) {
        return (
          <div className="space-y-1.5">
            {opps.map((o, i) => <OpportunityCard key={o.Id || i} opp={o} />)}
          </div>
        );
      }
      if (contacts.length > 0) {
        return (
          <div className="space-y-1.5">
            {contacts.map((c, i) => <ContactCard key={c.Id || i} contact={c} />)}
          </div>
        );
      }
    }
  }

  // Single
  if (isOpportunity(data)) return <OpportunityCard opp={data} />;
  if (isContact(data)) return <ContactCard contact={data} />;

  // Array
  if (Array.isArray(data)) {
    const contacts = data.filter(isContact);
    if (contacts.length > 0) {
      return <div className="space-y-1.5">{contacts.map((c, i) => <ContactCard key={c.Id || i} contact={c} />)}</div>;
    }
    const opps = data.filter(isOpportunity);
    if (opps.length > 0) {
      return <div className="space-y-1.5">{opps.map((o, i) => <OpportunityCard key={o.Id || i} opp={o} />)}</div>;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
