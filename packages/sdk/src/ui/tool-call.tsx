import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { ProviderIcon } from "./provider-icon.js";
import { humanizeToolName, getProviderLabel, getProviderFromToolName } from "./utils.js";

interface ToolCallPart {
  type: string;
  toolInvocation?: {
    toolName: string;
    state: string;
    args?: Record<string, unknown>;
    result?: unknown;
  };
  // AI SDK v4 tool-invocation parts
  toolName?: string;
  state?: string;
  args?: Record<string, unknown>;
}

interface SupyagentToolCallProps {
  part: ToolCallPart;
}

export function SupyagentToolCall({ part }: SupyagentToolCallProps) {
  const [expanded, setExpanded] = useState(false);

  const toolName = part.toolName || part.toolInvocation?.toolName || "unknown";
  const state = part.state || part.toolInvocation?.state || "input-available";
  const args = part.args || part.toolInvocation?.args;

  const provider = getProviderFromToolName(toolName);
  const providerLabel = getProviderLabel(provider);
  const actionLabel = humanizeToolName(toolName);

  const isStreaming = state === "input-streaming";
  const isError = state === "output-error";
  const isDone = state === "output-available";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => args && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <div className="relative">
          <ProviderIcon toolName={toolName} className="h-4 w-4 text-zinc-400" />
          {isStreaming && (
            <Loader2 className="absolute -top-1 -right-1 h-3 w-3 text-blue-400 animate-spin" />
          )}
        </div>

        <span className="text-xs text-zinc-500">{providerLabel}</span>
        <span className="text-sm text-zinc-300 flex-1">{actionLabel}</span>

        {isDone && <Check className="h-3.5 w-3.5 text-green-400" />}
        {isError && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
        {isStreaming && (
          <span className="text-xs text-zinc-500 animate-pulse">Running...</span>
        )}

        {args && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            : <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        )}
      </button>

      {expanded && args && (
        <div className="border-t border-zinc-800 px-3 py-2">
          <pre className="text-xs text-zinc-400 overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
