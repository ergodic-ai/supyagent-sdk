import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { ProviderIcon } from "./provider-icon.js";
import { humanizeToolName, getProviderLabel, getProviderFromToolName, getFormatterType } from "./utils.js";
import { getSummary, type SummaryResult } from "./summaries.js";
import {
  type ToolResultPart,
  extractToolName,
  extractState,
  extractArgs,
  extractResult,
  maybeNormalize,
  renderFormatter,
} from "./tool-result.js";
import { ToolInput } from "./tool-input.js";

interface SupyagentToolActionProps {
  part: ToolResultPart;
  defaultExpanded?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-500",
  error: "bg-destructive/10 text-destructive",
  warning: "bg-yellow-500/10 text-yellow-600",
};

export function SupyagentToolAction({ part, defaultExpanded = false }: SupyagentToolActionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toolName = extractToolName(part);
  const state = extractState(part);
  const args = extractArgs(part);

  const provider = getProviderFromToolName(toolName);
  const providerLabel = getProviderLabel(provider);
  const actionLabel = humanizeToolName(toolName);

  // Support both legacy state names and AI SDK v6 state names
  const isStreaming = state === "input-streaming" || state === "partial-call" || state === "call";
  const isError = state === "output-error" || state === "error";
  const isDone = state === "output-available" || state === "result";
  const hasResult = isDone || isError;

  // Compute summary and formatter output when result is available
  let summary: SummaryResult | undefined;
  let formatterOutput: React.ReactNode | undefined;

  if (hasResult) {
    const result = extractResult(part);
    if (result !== undefined) {
      const formatterType = getFormatterType(toolName);
      const data = maybeNormalize(toolName, formatterType, result);
      summary = getSummary(formatterType, data, toolName);
      formatterOutput = renderFormatter(formatterType, data);
    }
  }

  // Determine if there's content to expand
  const hasArgs = args && Object.keys(args).length > 0;
  const hasExpandableContent = hasArgs || formatterOutput;
  const canExpand = !isStreaming && hasExpandableContent;

  return (
    <div
      className="rounded-lg border border-border bg-card overflow-hidden"
      data-state={isDone ? "done" : isError ? "error" : isStreaming ? "streaming" : "pending"}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => canExpand && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors ${
          canExpand ? "hover:bg-muted cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="relative shrink-0">
          <ProviderIcon toolName={toolName} className="h-4 w-4 text-muted-foreground" />
          {isStreaming && (
            <Loader2 className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-spin" />
          )}
        </div>

        <span className="text-xs text-muted-foreground">{providerLabel}</span>
        <span className="text-sm text-foreground">{actionLabel}</span>

        {/* Summary text (when result available) */}
        {summary && (
          <>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-sm text-muted-foreground flex-1 truncate">{summary.text}</span>
          </>
        )}
        {!summary && <span className="flex-1" />}

        {/* Badge */}
        {summary?.badge && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
              BADGE_STYLES[summary.badge.variant || "default"]
            }`}
          >
            {summary.badge.text}
          </span>
        )}

        {/* Status indicator */}
        {isDone && (
          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
        )}
        {isError && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive shrink-0">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        )}
        {isStreaming && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary animate-pulse shrink-0">
            Calling...
          </span>
        )}

        {/* Chevron */}
        {canExpand && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expandable body */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-3 py-2 space-y-3">
            {/* Input section */}
            {args && Object.keys(args).length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Input
                </p>
                <ToolInput args={args} />
              </div>
            )}

            {/* Output section */}
            {formatterOutput && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Output
                </p>
                {formatterOutput}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
