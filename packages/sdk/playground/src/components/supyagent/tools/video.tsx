import React from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface VideoRendererProps {
  data: unknown;
}

export function VideoRenderer({ data }: VideoRendererProps) {
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

  if (d.status === "processing" || (d.poll_url && !d.answer && !d.result)) {
    const eta = typeof d.estimated_time_seconds === "number"
      ? ` (~${d.estimated_time_seconds}s)`
      : "";
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Processing video...{eta}</span>
      </div>
    );
  }

  // Video understanding — text answer
  if (typeof d.answer === "string") {
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-sm text-foreground whitespace-pre-wrap">{d.answer}</p>
      </div>
    );
  }

  // Video generation — playable result
  if (d.result && typeof d.result === "object") {
    const result = d.result as Record<string, unknown>;
    const videoUrl = typeof result.output === "string"
      ? result.output
      : typeof result.url === "string"
        ? result.url
        : typeof result.video_url === "string"
          ? result.video_url
          : null;

    if (videoUrl) {
      return (
        <div className="space-y-2">
          <video
            controls
            className="rounded-lg max-w-full max-h-96 border border-border"
          >
            <source src={videoUrl} />
          </video>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Open video
          </a>
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
