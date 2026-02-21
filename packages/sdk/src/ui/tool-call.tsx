import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { ProviderIcon } from "./provider-icon.js";
import { humanizeToolName, getProviderLabel, getProviderFromToolName } from "./utils.js";

interface ToolCallPart {
  type: string;
  // AI SDK v4+ (tool-{name} or dynamic-tool)
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  // AI SDK v3 (tool-invocation)
  toolInvocation?: {
    toolName: string;
    state: string;
    args?: Record<string, unknown>;
    result?: unknown;
  };
  // Legacy v4 fields
  args?: Record<string, unknown>;
}

interface SupyagentToolCallProps {
  part: ToolCallPart;
}

/**
 * Extract the tool name from a part.
 * Handles: tool-{name} type, dynamic-tool with toolName, legacy tool-invocation, direct toolName.
 */
function extractToolName(part: ToolCallPart): string {
  // AI SDK v4+: type is "tool-{name}"
  if (part.type.startsWith("tool-") && part.type !== "tool-invocation") {
    return part.type.slice(5); // strip "tool-" prefix
  }
  // Dynamic tool
  if (part.type === "dynamic-tool" && part.toolName) {
    return part.toolName;
  }
  // Direct toolName field
  if (part.toolName) return part.toolName;
  // Legacy v3
  if (part.toolInvocation?.toolName) return part.toolInvocation.toolName;
  return "unknown";
}

function extractState(part: ToolCallPart): string {
  return part.state || part.toolInvocation?.state || "input-available";
}

function extractArgs(part: ToolCallPart): Record<string, unknown> | undefined {
  return part.input || part.args || part.toolInvocation?.args;
}

export function SupyagentToolCall({ part }: SupyagentToolCallProps) {
  const [expanded, setExpanded] = useState(false);

  const toolName = extractToolName(part);
  const state = extractState(part);
  const args = extractArgs(part);

  const provider = getProviderFromToolName(toolName);
  const providerLabel = getProviderLabel(provider);
  const actionLabel = humanizeToolName(toolName);

  const isStreaming = state === "input-streaming";
  const isError = state === "output-error";
  const isDone = state === "output-available";

  return (
    <div
      className="rounded-lg border border-border bg-card overflow-hidden"
      data-state={isDone ? "done" : isError ? "error" : isStreaming ? "streaming" : "pending"}
    >
      <button
        type="button"
        onClick={() => args && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted transition-colors"
      >
        <div className="relative">
          <ProviderIcon toolName={toolName} className="h-4 w-4 text-muted-foreground" />
          {isStreaming && (
            <Loader2 className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-spin" />
          )}
        </div>

        <span className="text-xs text-muted-foreground">{providerLabel}</span>
        <span className="text-sm text-foreground flex-1">{actionLabel}</span>

        {isDone && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
            <Check className="h-3 w-3" />
            Completed
          </span>
        )}
        {isError && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        )}
        {isStreaming && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary animate-pulse">
            Calling...
          </span>
        )}

        {args && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {expanded && args && (
        <div className="border-t border-border px-3 py-2">
          <pre className="text-xs text-muted-foreground overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
