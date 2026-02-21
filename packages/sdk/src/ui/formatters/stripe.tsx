import React from "react";
import { CreditCard, User, FileText, Clock, RefreshCw } from "lucide-react";

interface StripeCustomerData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  created?: number;
}

interface StripeInvoiceData {
  id?: string;
  number?: string;
  amount_due?: number;
  amount_paid?: number;
  currency?: string;
  status?: string;
  customer_name?: string;
  due_date?: number;
}

interface StripeSubscriptionData {
  id?: string;
  status?: string;
  plan?: { nickname?: string; amount?: number; currency?: string; interval?: string };
  current_period_start?: number;
  current_period_end?: number;
}

interface StripeBalanceData {
  available?: Array<{ amount: number; currency: string }>;
  pending?: Array<{ amount: number; currency: string }>;
}

interface StripeFormatterProps {
  data: unknown;
}

function isCustomer(data: unknown): data is StripeCustomerData {
  return typeof data === "object" && data !== null && ("email" in data || "name" in data) && !("amount_due" in data) && !("plan" in data);
}

function isInvoice(data: unknown): data is StripeInvoiceData {
  return typeof data === "object" && data !== null && ("number" in data || "amount_due" in data);
}

function isSubscription(data: unknown): data is StripeSubscriptionData {
  return typeof data === "object" && data !== null && "plan" in data && "status" in data;
}

function isBalance(data: unknown): data is StripeBalanceData {
  return typeof data === "object" && data !== null && ("available" in data || "pending" in data);
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatUnixDate(ts: number): string {
  try {
    return new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(ts);
  }
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/10 text-green-500",
  active: "bg-green-500/10 text-green-500",
  open: "bg-blue-500/10 text-blue-500",
  draft: "bg-muted text-muted-foreground",
  void: "bg-muted text-muted-foreground",
  uncollectible: "bg-destructive/10 text-destructive",
  past_due: "bg-destructive/10 text-destructive",
  canceled: "bg-destructive/10 text-destructive",
  trialing: "bg-yellow-500/10 text-yellow-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function CustomerCard({ customer }: { customer: StripeCustomerData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{customer.name || "Unnamed customer"}</p>
          {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({ invoice }: { invoice: StripeInvoiceData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{invoice.number || invoice.id}</p>
          {invoice.customer_name && <p className="text-xs text-muted-foreground">{invoice.customer_name}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {invoice.amount_due !== undefined && invoice.currency && (
            <span className="text-sm font-medium text-foreground">{formatAmount(invoice.amount_due, invoice.currency)}</span>
          )}
          {invoice.status && <StatusBadge status={invoice.status} />}
        </div>
      </div>
    </div>
  );
}

function SubscriptionCard({ sub }: { sub: StripeSubscriptionData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {sub.plan?.nickname || "Subscription"}
            {sub.plan?.amount !== undefined && sub.plan?.currency && (
              <span className="text-muted-foreground font-normal"> {formatAmount(sub.plan.amount, sub.plan.currency)}/{sub.plan.interval}</span>
            )}
          </p>
          {sub.current_period_end && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Renews {formatUnixDate(sub.current_period_end)}
            </p>
          )}
        </div>
        {sub.status && <StatusBadge status={sub.status} />}
      </div>
    </div>
  );
}

function BalanceDisplay({ balance }: { balance: StripeBalanceData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Balance</span>
      </div>
      <div className="grid grid-cols-2 gap-4 pl-6">
        {balance.available && balance.available.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            {balance.available.map((b, i) => (
              <p key={i} className="text-sm font-medium text-foreground">{formatAmount(b.amount, b.currency)}</p>
            ))}
          </div>
        )}
        {balance.pending && balance.pending.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            {balance.pending.map((b, i) => (
              <p key={i} className="text-sm font-medium text-foreground">{formatAmount(b.amount, b.currency)}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StripeFormatter({ data }: StripeFormatterProps) {
  // Balance
  if (isBalance(data)) return <BalanceDisplay balance={data} />;

  // List response {data: [...]}
  if (typeof data === "object" && data !== null && "data" in data && Array.isArray((data as any).data)) {
    const items = (data as any).data as unknown[];
    const invoices = items.filter(isInvoice);
    if (invoices.length > 0) {
      return (
        <div className="space-y-1.5">
          {invoices.map((inv, i) => <InvoiceCard key={inv.id || i} invoice={inv} />)}
        </div>
      );
    }
    const subs = items.filter(isSubscription);
    if (subs.length > 0) {
      return (
        <div className="space-y-1.5">
          {subs.map((s, i) => <SubscriptionCard key={s.id || i} sub={s} />)}
        </div>
      );
    }
    const customers = items.filter(isCustomer);
    if (customers.length > 0) {
      return (
        <div className="space-y-1.5">
          {customers.map((c, i) => <CustomerCard key={c.id || i} customer={c} />)}
        </div>
      );
    }
  }

  // Single items
  if (isInvoice(data)) return <InvoiceCard invoice={data} />;
  if (isSubscription(data)) return <SubscriptionCard sub={data} />;
  if (isCustomer(data)) return <CustomerCard customer={data} />;

  // Array
  if (Array.isArray(data)) {
    const invoices = data.filter(isInvoice);
    if (invoices.length > 0) {
      return <div className="space-y-1.5">{invoices.map((inv, i) => <InvoiceCard key={inv.id || i} invoice={inv} />)}</div>;
    }
    const customers = data.filter(isCustomer);
    if (customers.length > 0) {
      return <div className="space-y-1.5">{customers.map((c, i) => <CustomerCard key={c.id || i} customer={c} />)}</div>;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
