import React from "react";
import { Terminal, AlertTriangle, Check, X } from "lucide-react";

interface ComputeData {
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  exitCode?: number;
  duration?: number;
  duration_ms?: number;
  output?: string;
  error?: string;
  url?: string;
  files?: Array<{ name?: string; url?: string; size?: number }>;
}

interface ComputeRendererProps {
  data: unknown;
}

function isComputeData(data: unknown): data is ComputeData {
  if (typeof data !== "object" || data === null) return false;
  return "stdout" in data || "stderr" in data || "exit_code" in data || "exitCode" in data || "output" in data;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function ComputeRenderer({ data }: ComputeRendererProps) {
  if (!isComputeData(data)) {
    return (
      <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  const exitCode = data.exit_code ?? data.exitCode;
  const duration = data.duration_ms ?? data.duration;
  const stdout = data.stdout || data.output || "";
  const stderr = data.stderr || data.error || "";
  const success = exitCode === undefined || exitCode === 0;

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border-b border-border">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground flex-1">Output</span>
          <div className="flex items-center gap-2">
            {duration !== undefined && (
              <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
            )}
            {exitCode !== undefined && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                success ? "text-green-500 bg-green-500/10" : "text-destructive bg-destructive/10"
              }`}>
                {success ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
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
          <p className="p-3 text-xs text-muted-foreground italic">No output</p>
        )}
      </div>

      {/* Output files */}
      {data.files && data.files.length > 0 && (
        <div className="space-y-1">
          {data.files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {file.url ? (
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                  {file.name || file.url}
                </a>
              ) : (
                <span className="text-xs text-foreground truncate">{file.name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
