import React from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface AudioRendererProps {
  data: unknown;
}

export function AudioRenderer({ data }: AudioRendererProps) {
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

  if (d.status === "processing" || (d.poll_url && !d.audio_url)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Processing audio...</span>
      </div>
    );
  }

  // TTS result — audio player
  if (typeof d.audio_url === "string") {
    return (
      <div className="space-y-2">
        <audio controls className="w-full max-w-md">
          <source src={d.audio_url} />
        </audio>
        <a
          href={d.audio_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Download audio
        </a>
      </div>
    );
  }

  // STT result — transcription text
  if (d.result && typeof d.result === "object") {
    const result = d.result as Record<string, unknown>;
    if (typeof result.text === "string") {
      return (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">{result.text}</p>
          </div>
          {result.tokens_used != null && (
            <p className="text-xs text-muted-foreground">
              Tokens used: {String(result.tokens_used)}
            </p>
          )}
        </div>
      );
    }
  }

  // OCR-like text result at top level
  if (typeof d.text === "string") {
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-sm text-foreground whitespace-pre-wrap">{d.text}</p>
        {d.tokens_used != null && (
          <p className="text-xs text-muted-foreground mt-2">
            Tokens used: {String(d.tokens_used)}
          </p>
        )}
      </div>
    );
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
