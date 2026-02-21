import React from "react";
import { Terminal, AlertTriangle, Check, X, Clock, Timer } from "lucide-react";

interface BashData {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  exit_code?: number;
  durationMs?: number;
  duration_ms?: number;
  timedOut?: boolean;
  timed_out?: boolean;
  output?: string;
  error?: string;
}

interface BashRendererProps {
  data: unknown;
}

function isBashData(data: unknown): data is BashData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as any;
  return (
    "stdout" in d ||
    "stderr" in d ||
    "exitCode" in d ||
    "exit_code" in d ||
    ("output" in d && ("exitCode" in d || "exit_code" in d || "durationMs" in d))
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function BashRenderer({ data }: BashRendererProps) {
  if (!isBashData(data)) {
    return (
      <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  const exitCode = data.exitCode ?? data.exit_code;
  const duration = data.durationMs ?? data.duration_ms;
  const stdout = data.stdout || data.output || "";
  const stderr = data.stderr || data.error || "";
  const timedOut = data.timedOut ?? data.timed_out;
  const success = !timedOut && (exitCode === undefined || exitCode === 0);

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border-b border-border">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground flex-1">Output</span>
        <div className="flex items-center gap-2">
          {duration !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatDuration(duration)}
            </span>
          )}
          {timedOut && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-yellow-500 bg-yellow-500/10">
              <Clock className="h-3 w-3" />
              timed out
            </span>
          )}
          {exitCode !== undefined && !timedOut && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                success
                  ? "text-green-500 bg-green-500/10"
                  : "text-destructive bg-destructive/10"
              }`}
            >
              {success ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              exit {exitCode}
            </span>
          )}
        </div>
      </div>

      {/* Stdout */}
      {stdout && (
        <pre className="p-3 text-xs text-foreground overflow-x-auto max-h-80 overflow-y-auto font-mono whitespace-pre-wrap">
          {stdout}
        </pre>
      )}

      {/* Stderr */}
      {stderr && (
        <div className="border-t border-border">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-destructive/5">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span className="text-xs text-destructive">stderr</span>
          </div>
          <pre className="p-3 text-xs text-destructive overflow-x-auto max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
            {stderr}
          </pre>
        </div>
      )}

      {!stdout && !stderr && (
        <p className="p-3 text-xs text-muted-foreground italic">
          No output
        </p>
      )}
    </div>
  );
}
