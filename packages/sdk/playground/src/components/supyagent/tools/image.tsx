import React from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface ImageRendererProps {
  data: unknown;
}

export function ImageRenderer({ data }: ImageRendererProps) {
  if (typeof data !== "object" || data === null) {
    return (
      <p className="text-sm text-muted-foreground italic">No data returned</p>
    );
  }

  const d = data as Record<string, unknown>;

  if (d.error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
        <p className="text-sm text-destructive">{String(d.error)}</p>
      </div>
    );
  }

  if (d.status === "processing" || (d.poll_url && !d.image_url)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Generating image...</span>
      </div>
    );
  }

  if (typeof d.image_url === "string") {
    return (
      <div className="space-y-2">
        <a
          href={d.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={d.image_url}
            alt="Generated image"
            className="rounded-lg max-w-full max-h-96 object-contain border border-border"
          />
        </a>
        <a
          href={d.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Open full size
        </a>
      </div>
    );
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
