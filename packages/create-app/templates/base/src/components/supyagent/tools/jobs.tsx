import React from "react";
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

interface JobsRendererProps {
  data: unknown;
}

export function JobsRenderer({ data }: JobsRendererProps) {
  if (typeof data !== "object" || data === null) {
    return (
      <p className="text-sm text-muted-foreground italic">No data returned</p>
    );
  }

  const d = data as Record<string, unknown>;

  const service = typeof d.service === "string" ? d.service : "";
  const action = typeof d.action === "string" ? d.action : "";
  const status = typeof d.status === "string" ? d.status : "unknown";
  const label = service
    ? `${service.charAt(0).toUpperCase() + service.slice(1)}${action ? ` ${action}` : ""}`
    : "Job";

  const elapsed = formatElapsed(d.created_at, d.completed_at);
  const resultUrl = extractResultUrl(d);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusIcon status={status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {status === "processing" && <ElapsedTimer createdAt={d.created_at} />}
            {status === "completed" && elapsed && `Completed in ${elapsed}`}
            {status === "completed" && !elapsed && "Completed"}
            {status === "failed" && "Failed"}
            {status !== "processing" && status !== "completed" && status !== "failed" && `Status: ${status}`}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Error */}
      {d.error && typeof d.error === "string" && (
        <div className="border-t border-border px-4 py-3 bg-destructive/5">
          <p className="text-sm text-destructive">{d.error}</p>
        </div>
      )}

      {/* Result link */}
      {status === "completed" && resultUrl && (
        <div className="border-t border-border px-4 py-3">
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View result
          </a>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "processing":
      return <Loader2 className="h-5 w-5 animate-spin text-amber-500 shrink-0" />;
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-destructive shrink-0" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground shrink-0" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[status] || "bg-muted text-muted-foreground border-border"}`}
    >
      {status}
    </span>
  );
}

function ElapsedTimer({ createdAt }: { createdAt: unknown }) {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (typeof createdAt !== "string") return <>Processing...</>;
  const start = new Date(createdAt).getTime();
  if (isNaN(start)) return <>Processing...</>;

  const sec = Math.max(0, Math.round((now - start) / 1000));
  if (sec < 60) return <>Started {sec}s ago</>;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return <>Started {min}m {rem}s ago</>;
}

function formatElapsed(start: unknown, end: unknown): string | undefined {
  if (typeof start !== "string") return undefined;
  const s = new Date(start).getTime();
  const e = typeof end === "string" ? new Date(end).getTime() : Date.now();
  if (isNaN(s) || isNaN(e)) return undefined;
  const sec = Math.round((e - s) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
}

function extractResultUrl(d: Record<string, unknown>): string | undefined {
  if (d.result && typeof d.result === "object" && d.result !== null) {
    const r = d.result as Record<string, unknown>;
    for (const key of ["output", "url", "image_url", "audio_url", "video_url"]) {
      if (typeof r[key] === "string") return r[key] as string;
    }
  }
  return undefined;
}
