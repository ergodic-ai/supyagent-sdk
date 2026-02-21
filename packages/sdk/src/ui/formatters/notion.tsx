import React from "react";
import { FileText, Database, ExternalLink, Clock } from "lucide-react";

interface NotionPageData {
  id?: string;
  url?: string;
  last_edited_time?: string;
  lastEditedTime?: string;
  properties?: Record<string, unknown>;
  title?: string;
}

interface NotionDatabaseData {
  id?: string;
  title?: string | Array<{ plain_text?: string }>;
  description?: string | Array<{ plain_text?: string }>;
  url?: string;
  lastEditedTime?: string;
}

interface NotionFormatterProps {
  data: unknown;
}

function isNotionPage(data: unknown): data is NotionPageData {
  if (typeof data !== "object" || data === null) return false;
  // Raw Notion shape with properties
  if ("properties" in data) return true;
  // Notion URL-based detection
  if ("id" in data && "url" in data && String((data as any).url || "").includes("notion")) return true;
  // Normalized Supyagent shape: has title + id + parentType (distinguishes from database)
  if ("title" in data && "id" in data && "parentType" in data) return true;
  return false;
}

function isNotionDatabase(data: unknown): data is NotionDatabaseData {
  if (typeof data !== "object" || data === null) return false;
  // Raw Notion shape: title is an array
  if ("title" in data && Array.isArray((data as any).title) && "id" in data) return true;
  // Normalized Supyagent shape: has propertyCount (distinguishes from pages)
  if ("title" in data && "id" in data && "propertyCount" in data) return true;
  return false;
}

function extractPageTitle(page: NotionPageData): string {
  if (page.title) return page.title;
  if (page.properties) {
    for (const val of Object.values(page.properties)) {
      if (typeof val === "object" && val !== null && "title" in val) {
        const titles = (val as any).title;
        if (Array.isArray(titles) && titles.length > 0) {
          return titles.map((t: any) => t.plain_text || t.text?.content || "").join("");
        }
      }
    }
    // Check Name property (common)
    const name = page.properties.Name || page.properties.name;
    if (typeof name === "object" && name !== null && "title" in name) {
      const titles = (name as any).title;
      if (Array.isArray(titles) && titles.length > 0) {
        return titles.map((t: any) => t.plain_text || "").join("");
      }
    }
  }
  return "Untitled";
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function PageCard({ page }: { page: NotionPageData }) {
  const title = extractPageTitle(page);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {page.url ? (
              <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {title}
              </a>
            ) : (
              title
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(page.last_edited_time || page.lastEditedTime) && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelativeDate((page.last_edited_time || page.lastEditedTime)!)}
            </span>
          )}
          {page.url && (
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DatabaseCard({ db }: { db: NotionDatabaseData }) {
  const title = typeof db.title === "string"
    ? db.title
    : Array.isArray(db.title) && db.title.length > 0
      ? db.title.map((t) => t.plain_text || "").join("")
      : "Untitled database";
  const desc = typeof db.description === "string"
    ? db.description
    : Array.isArray(db.description) && db.description.length > 0
      ? db.description.map((d) => d.plain_text || "").join("")
      : null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {db.url ? (
              <a href={db.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {title}
              </a>
            ) : (
              title
            )}
          </p>
          {desc && <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>}
        </div>
      </div>
    </div>
  );
}

export function NotionFormatter({ data }: NotionFormatterProps) {
  // Pages array
  if (typeof data === "object" && data !== null && "pages" in data) {
    const pages = (data as any).pages;
    if (Array.isArray(pages)) {
      return (
        <div className="space-y-1.5">
          {pages.filter(isNotionPage).map((p, i) => <PageCard key={p.id || i} page={p} />)}
        </div>
      );
    }
  }

  // Databases array
  if (typeof data === "object" && data !== null && "databases" in data) {
    const dbs = (data as any).databases;
    if (Array.isArray(dbs)) {
      return (
        <div className="space-y-1.5">
          {dbs.filter(isNotionDatabase).map((d, i) => <DatabaseCard key={d.id || i} db={d} />)}
        </div>
      );
    }
  }

  // Results array (query response)
  if (typeof data === "object" && data !== null && "results" in data) {
    const results = (data as any).results;
    if (Array.isArray(results)) {
      const pages = results.filter(isNotionPage);
      if (pages.length > 0) {
        return (
          <div className="space-y-1.5">
            {pages.map((p, i) => <PageCard key={p.id || i} page={p} />)}
          </div>
        );
      }
      const dbs = results.filter(isNotionDatabase);
      if (dbs.length > 0) {
        return (
          <div className="space-y-1.5">
            {dbs.map((d, i) => <DatabaseCard key={d.id || i} db={d} />)}
          </div>
        );
      }
    }
  }

  // Single page
  if (isNotionPage(data)) return <PageCard page={data} />;

  // Single database
  if (isNotionDatabase(data)) return <DatabaseCard db={data} />;

  // Array
  if (Array.isArray(data)) {
    const pages = data.filter(isNotionPage);
    if (pages.length > 0) {
      return (
        <div className="space-y-1.5">
          {pages.map((p, i) => <PageCard key={p.id || i} page={p} />)}
        </div>
      );
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
