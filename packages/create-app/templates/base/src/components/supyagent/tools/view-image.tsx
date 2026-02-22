import React from "react";
import { Image, ExternalLink } from "lucide-react";

interface ViewImageData {
  url?: string;
  displayed?: boolean;
}

interface ViewImageRendererProps {
  data: unknown;
}

function isViewImageData(data: unknown): data is ViewImageData {
  return typeof data === "object" && data !== null && "url" in data;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function ViewImageRenderer({ data }: ViewImageRendererProps) {
  if (!isViewImageData(data) || !data.url) {
    return (
      <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border-b border-border">
          <Image className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground flex-1 truncate">{getDomain(data.url)}</span>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="p-2">
          <img
            src={data.url}
            alt="Viewed image"
            className="w-full rounded border border-border"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
