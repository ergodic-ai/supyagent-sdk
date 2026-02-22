import type { UIMessage } from "ai";
import type { ContextMessageMetadata } from "../context/types.js";

export interface ContextIndicatorProps {
  /** The full messages array from useChat() */
  messages: UIMessage[];
  /** Maximum token limit for the context window. @default 128000 */
  maxTokens?: number;
  /** Optional className for the outer container */
  className?: string;
}

/**
 * A small progress bar that shows current context window usage.
 *
 * Reads `message.metadata.context` from the most recent assistant message
 * and renders a colour-coded indicator.
 *
 * Returns `null` until at least one assistant response has been received.
 */
export function ContextIndicator({
  messages,
  maxTokens = 128_000,
  className,
}: ContextIndicatorProps) {
  const lastContext = findLastContextMetadata(messages);

  if (!lastContext) return null;

  const ratio = Math.min(lastContext.usageRatio ?? 0, 1);
  const percent = Math.round(ratio * 100);
  const totalTokens = lastContext.totalTokens ?? 0;

  const color =
    ratio < 0.5
      ? "bg-emerald-500"
      : ratio < 0.75
        ? "bg-yellow-500"
        : ratio < 0.9
          ? "bg-orange-500"
          : "bg-red-500";

  const label = formatTokens(totalTokens);
  const maxLabel = formatTokens(maxTokens);

  return (
    <div
      className={className}
      title={`Context: ${label} / ${maxLabel} tokens (${percent}%)`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

function findLastContextMetadata(
  messages: UIMessage[]
): ContextMessageMetadata["context"] | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const meta = messages[i].metadata as ContextMessageMetadata | undefined;
    if (meta?.context) return meta.context;
  }
  return null;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}
