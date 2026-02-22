import React from "react";
import { Globe, ExternalLink, FileText, Image } from "lucide-react";

interface BrowserData {
  url?: string;
  title?: string;
  content?: string;
  text?: string;
  markdown?: string;
  screenshot_url?: string;
  screenshot?: string;
  status?: number | string;
  links?: Array<{ text?: string; href?: string }>;
}

interface BrowserFormatterProps {
  data: unknown;
}

function isBrowserData(data: unknown): data is BrowserData {
  if (typeof data !== "object" || data === null) return false;
  return "url" in data || "content" in data || "text" in data || "markdown" in data || "screenshot_url" in data || "screenshot" in data;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function BrowserFormatter({ data }: BrowserFormatterProps) {
  if (!isBrowserData(data)) {
    return (
      <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  const content = data.content || data.text || data.markdown || "";
  const screenshotUrl = data.screenshot_url || data.screenshot;

  return (
    <div className="space-y-2">
      {/* URL Header */}
      {data.url && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              {data.title && (
                <p className="text-sm font-medium text-foreground truncate">{data.title}</p>
              )}
              <p className="text-xs text-muted-foreground truncate">{getDomain(data.url)}</p>
            </div>
            {data.status && (
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                Number(data.status) >= 200 && Number(data.status) < 300
                  ? "text-green-500 bg-green-500/10"
                  : Number(data.status) >= 400
                    ? "text-destructive bg-destructive/10"
                    : "text-muted-foreground bg-muted"
              }`}>
                {data.status}
              </span>
            )}
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Screenshot */}
      {screenshotUrl && (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border-b border-border">
            <Image className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Screenshot</span>
          </div>
          <div className="p-2">
            <img
              src={screenshotUrl}
              alt={data.title || "Page screenshot"}
              className="w-full rounded border border-border"
            />
          </div>
        </div>
      )}

      {/* Extracted content */}
      {content && (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border-b border-border">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Extracted content</span>
          </div>
          <pre className="p-3 text-xs text-foreground overflow-x-auto max-h-80 overflow-y-auto font-mono whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      )}

      {/* Links */}
      {data.links && data.links.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Links ({data.links.length})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.links.slice(0, 20).map((link, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                {link.href ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                    {link.text || link.href}
                  </a>
                ) : (
                  <span className="text-xs text-foreground truncate">{link.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!data.url && !content && !screenshotUrl && (
        <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
