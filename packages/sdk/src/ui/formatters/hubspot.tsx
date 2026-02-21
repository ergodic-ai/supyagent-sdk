import React from "react";
import {
  Users,
  Building2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  DollarSign,
  Calendar,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */

interface HubspotContactData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  properties?: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    [key: string]: unknown;
  };
}

interface HubspotCompanyData {
  id?: string;
  name?: string;
  domain?: string;
  industry?: string;
  employeeCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  /** Legacy shape: raw HubSpot properties */
  properties?: {
    name?: string;
    domain?: string;
    industry?: string;
    phone?: string;
    numberofemployees?: string;
    [key: string]: unknown;
  };
}

interface HubspotDealData {
  id?: string;
  name?: string;
  amount?: number | null;
  stage?: string;
  closeDate?: string;
  pipeline?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface HubspotFormatterProps {
  data: unknown;
}

/* ------------------------------------------------------------------ */
/*  Type guards                                                       */
/* ------------------------------------------------------------------ */

function isHubspotContact(data: unknown): data is HubspotContactData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as any;
  if ("firstName" in d || "lastName" in d || (d.email && d.id)) return true;
  const props = d.properties;
  return props && ("firstname" in props || "lastname" in props || "email" in props);
}

function isHubspotCompany(data: unknown): data is HubspotCompanyData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as any;
  // Flat shape from Supyagent API (has domain at top level)
  if ("domain" in d && !("email" in d) && !("amount" in d)) return true;
  // Legacy raw HubSpot properties shape
  const props = d.properties;
  return props && ("name" in props || "domain" in props);
}

function isHubspotDeal(data: unknown): data is HubspotDealData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as any;
  return ("amount" in d || "stage" in d || "closeDate" in d) && !("email" in d);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStageBadge(stage?: string) {
  if (!stage) return null;
  const s = stage.toLowerCase();
  if (s === "closedwon" || s === "closed won")
    return { label: "Won", className: "text-green-500 bg-green-500/10" };
  if (s === "closedlost" || s === "closed lost")
    return { label: "Lost", className: "text-red-400 bg-red-400/10" };
  // Custom stage IDs — show as "In Progress"
  if (/^\d+$/.test(stage))
    return { label: "In Progress", className: "text-blue-400 bg-blue-400/10" };
  return { label: stage, className: "text-muted-foreground bg-muted" };
}

/* ------------------------------------------------------------------ */
/*  Cards                                                             */
/* ------------------------------------------------------------------ */

function ContactCard({ contact }: { contact: HubspotContactData }) {
  const p = contact.properties || {};
  const first = contact.firstName || p.firstname;
  const last = contact.lastName || p.lastname;
  const email = contact.email || p.email;
  const phone = contact.phone || p.phone;
  const company = contact.company || p.company;
  const name = [first, last].filter(Boolean).join(" ") || "Unknown contact";

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{name}</p>
          {company && (
            <p className="text-xs text-muted-foreground">{company}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6">
        {email && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {email}
          </span>
        )}
        {phone && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {phone}
          </span>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: HubspotCompanyData }) {
  const p = company.properties || {};
  const name = company.name || p.name;
  const domain = company.domain || p.domain;
  const industry = company.industry || p.industry;
  const phone = p.phone;
  const employeeCount =
    company.employeeCount ?? (p.numberofemployees ? Number(p.numberofemployees) : null);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {name || "Unknown company"}
          </p>
          {industry && (
            <p className="text-xs text-muted-foreground">{industry}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs text-muted-foreground">
        {domain && (
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {domain}
          </span>
        )}
        {phone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {phone}
          </span>
        )}
        {employeeCount != null && employeeCount > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {employeeCount.toLocaleString()} employees
          </span>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: HubspotDealData }) {
  const stageBadge = getStageBadge(deal.stage);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {deal.name || "Untitled deal"}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {deal.amount != null && (
              <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(deal.amount)}
              </span>
            )}
            {stageBadge && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${stageBadge.className}`}
              >
                {stageBadge.label}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs text-muted-foreground">
        {deal.closeDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Close: {formatDate(deal.closeDate)}
          </span>
        )}
        {deal.pipeline && deal.pipeline !== "default" && (
          <span>{deal.pipeline}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List wrapper with optional paging indicator                       */
/* ------------------------------------------------------------------ */

function ListWrapper({
  children,
  hasMore,
}: {
  children: React.ReactNode;
  hasMore?: boolean;
}) {
  return (
    <div className="space-y-2">
      {children}
      {hasMore && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          More results available
        </p>
      )}
    </div>
  );
}

function hasPaging(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const paging = (data as any).paging;
  return paging && typeof paging === "object" && paging.next;
}

/* ------------------------------------------------------------------ */
/*  Formatter                                                         */
/* ------------------------------------------------------------------ */

export function HubspotFormatter({ data }: HubspotFormatterProps) {
  // Single contact
  if (isHubspotContact(data)) {
    return <ContactCard contact={data} />;
  }

  // Single deal
  if (isHubspotDeal(data)) {
    return <DealCard deal={data} />;
  }

  // Single company
  if (isHubspotCompany(data)) {
    return <CompanyCard company={data} />;
  }

  // Flat array
  if (Array.isArray(data)) {
    const deals = data.filter(isHubspotDeal);
    if (deals.length > 0) {
      return (
        <ListWrapper>
          {deals.map((d, i) => (
            <DealCard key={d.id || i} deal={d} />
          ))}
        </ListWrapper>
      );
    }
    const contacts = data.filter(isHubspotContact);
    if (contacts.length > 0) {
      return (
        <ListWrapper>
          {contacts.map((c, i) => (
            <ContactCard key={c.id || i} contact={c} />
          ))}
        </ListWrapper>
      );
    }
    const companies = data.filter(isHubspotCompany);
    if (companies.length > 0) {
      return (
        <ListWrapper>
          {companies.map((c, i) => (
            <CompanyCard key={c.id || i} company={c} />
          ))}
        </ListWrapper>
      );
    }
  }

  // Wrapper objects: { contacts: [...] }, { companies: [...] }, { deals: [...] }
  if (typeof data === "object" && data !== null) {
    const d = data as any;
    const more = hasPaging(data);

    if ("contacts" in d && Array.isArray(d.contacts)) {
      const valid = d.contacts.filter(isHubspotContact);
      if (valid.length > 0) {
        return (
          <ListWrapper hasMore={more}>
            {valid.map((c: HubspotContactData, i: number) => (
              <ContactCard key={c.id || i} contact={c} />
            ))}
          </ListWrapper>
        );
      }
    }

    if ("companies" in d && Array.isArray(d.companies)) {
      const valid = d.companies.filter(isHubspotCompany);
      if (valid.length > 0) {
        return (
          <ListWrapper hasMore={more}>
            {valid.map((c: HubspotCompanyData, i: number) => (
              <CompanyCard key={c.id || i} company={c} />
            ))}
          </ListWrapper>
        );
      }
    }

    if ("deals" in d && Array.isArray(d.deals)) {
      const valid = d.deals.filter(isHubspotDeal);
      if (valid.length > 0) {
        return (
          <ListWrapper hasMore={more}>
            {valid.map((deal: HubspotDealData, i: number) => (
              <DealCard key={deal.id || i} deal={deal} />
            ))}
          </ListWrapper>
        );
      }
    }

    // Raw HubSpot shape: { results: [...] }
    if ("results" in d && Array.isArray(d.results)) {
      const results = d.results;
      const deals = results.filter(isHubspotDeal);
      if (deals.length > 0) {
        return (
          <ListWrapper hasMore={more}>
            {deals.map((deal: HubspotDealData, i: number) => (
              <DealCard key={deal.id || i} deal={deal} />
            ))}
          </ListWrapper>
        );
      }
      const contacts = results.filter(isHubspotContact);
      if (contacts.length > 0) {
        return (
          <ListWrapper hasMore={more}>
            {contacts.map((c: HubspotContactData, i: number) => (
              <ContactCard key={c.id || i} contact={c} />
            ))}
          </ListWrapper>
        );
      }
      const companies = results.filter(isHubspotCompany);
      if (companies.length > 0) {
        return (
          <ListWrapper hasMore={more}>
            {companies.map((c: HubspotCompanyData, i: number) => (
              <CompanyCard key={c.id || i} company={c} />
            ))}
          </ListWrapper>
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
