"use client";

import type { ReactNode } from "react";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolOutput,
  type ToolState,
} from "@/components/ai-elements/tool";
import {
  extractToolName,
  extractState,
  extractResult,
  extractArgs,
  maybeNormalize,
  getFormatterType,
  getSummary,
  ProviderIcon,
  humanizeToolName,
  getProviderLabel,
  getProviderFromToolName,
  ToolInput,
} from "@supyagent/sdk/react";
import { getToolRenderer } from "./tool-renderers";

interface ToolMessageProps {
  part: any; // ToolInvocationUIPart from AI SDK
  addToolApprovalResponse?: (opts: { id: string; approved: boolean }) => void;
}

export function ToolMessage({ part, addToolApprovalResponse }: ToolMessageProps) {
  const toolName = extractToolName(part);
  const state = extractState(part);
  const args = extractArgs(part);

  const toolState = resolveState(state);
  const isDone = toolState === "output-available";
  const isError = toolState === "output-error";
  const isApprovalRequested = toolState === "approval-requested";
  const isDenied = toolState === "output-denied";

  // Extract and format result data
  let renderedOutput: ReactNode = null;
  let summary: string | undefined;

  if (isDone || isError) {
    const result = extractResult(part);
    if (result !== undefined) {
      const formatterType = getFormatterType(toolName);
      const data = maybeNormalize(toolName, formatterType, result);
      const summaryResult = getSummary(formatterType, data, toolName);
      summary = summaryResult.text;

      const Renderer = getToolRenderer(formatterType);
      renderedOutput = <Renderer data={data} />;
    }
  }

  const provider = getProviderFromToolName(toolName);

  return (
    <Tool defaultOpen={isDone || isApprovalRequested} className={isApprovalRequested ? "animate-approval-pulse" : undefined}>
      <ToolHeader
        state={toolState}
        title={`${getProviderLabel(provider)} · ${humanizeToolName(toolName)}${summary ? ` — ${summary}` : ""}`}
        icon={<ProviderIcon toolName={toolName} className="size-4 text-muted-foreground" />}
      />
      <ToolContent>
        {args && Object.keys(args).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Parameters
            </h4>
            <ToolInput args={args} />
          </div>
        )}

        {/* Approval UI */}
        {isApprovalRequested && addToolApprovalResponse && part.approval && (
          <div className="flex items-center gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="flex-1 text-sm text-muted-foreground">
              This tool requires your approval to execute.
            </p>
            <button
              type="button"
              onClick={() => addToolApprovalResponse({
                id: part.approval.id,
                approved: false,
              })}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Deny
            </button>
            <button
              type="button"
              onClick={() => addToolApprovalResponse({
                id: part.approval.id,
                approved: true,
              })}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background hover:bg-foreground/90 transition-colors"
            >
              Approve
            </button>
          </div>
        )}

        {/* Denied message */}
        {isDenied && (
          <p className="text-sm text-muted-foreground italic">
            Execution was denied by user.
          </p>
        )}

        {renderedOutput && (
          <ToolOutput output={renderedOutput} isError={isError} />
        )}
      </ToolContent>
    </Tool>
  );
}

function resolveState(state?: string): ToolState {
  switch (state) {
    case "result":
    case "output-available":
      return "output-available";
    case "error":
    case "output-error":
      return "output-error";
    case "approval-requested":
      return "approval-requested";
    case "approval-responded":
      return "approval-responded";
    case "output-denied":
      return "output-denied";
    case "call":
    case "partial-call":
    case "input-streaming":
      return "input-streaming";
    default:
      return "input-available";
  }
}
