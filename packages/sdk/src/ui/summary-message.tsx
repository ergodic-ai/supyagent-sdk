import { useState } from "react";
import type { UIMessage } from "ai";
import type { ContextSummaryMetadata } from "../context/types.js";

export interface SummaryMessageProps {
  /** The summary UIMessage (must have metadata.type === "context-summary") */
  message: UIMessage;
  /** Optional className for the outer container */
  className?: string;
}

/**
 * Renders a context-summary message as a collapsible card.
 *
 * Visually distinct from regular chat messages — dashed border,
 * muted styling, and an expand/collapse toggle to reveal the summary text.
 */
export function SummaryMessage({ message, className }: SummaryMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = message.metadata as ContextSummaryMetadata | undefined;

  const summaryText =
    message.parts.find((p) => p.type === "text") as
      | { type: "text"; text: string }
      | undefined;

  const messageCount = meta?.messagesSummarized ?? 0;

  return (
    <div
      className={`rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">
          Context summarized
          {messageCount > 0 && ` (${messageCount} messages)`}
        </span>
      </button>

      {expanded && summaryText?.text && (
        <div className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {summaryText.text}
        </div>
      )}
    </div>
  );
}

/** Check whether a UIMessage is a context-summary message. */
export function isContextSummary(message: UIMessage): boolean {
  const meta = message.metadata as ContextSummaryMetadata | undefined;
  return meta?.type === "context-summary";
}
