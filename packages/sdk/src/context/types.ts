import type { UIMessage } from "ai";

// ── Configuration ──────────────────────────────────────────────────────

export interface ContextManagerOptions {
  /**
   * Maximum context window size in tokens for the model.
   * Used to calculate soft/hard thresholds.
   * @default 128_000
   */
  maxTokens?: number;

  /**
   * Soft threshold as a fraction of maxTokens (0–1).
   * When exceeded after a response completes, triggers background summarization.
   * @default 0.75
   */
  softThreshold?: number;

  /**
   * Hard threshold as a fraction of maxTokens (0–1).
   * When exceeded, blocks before the next LLM call and compactifies synchronously.
   * @default 0.90
   */
  hardThreshold?: number;

  /**
   * Tokens to reserve for the model's response output.
   * Subtracted from the context budget when checking thresholds.
   * @default 4096
   */
  responseReserve?: number;

  /**
   * Minimum number of recent messages to always keep (never summarized away).
   * @default 4
   */
  minRecentMessages?: number;

  /**
   * Custom prompt for the default summarizer.
   * Overrides the built-in summarization system prompt.
   */
  summaryPrompt?: string;

  /**
   * Full override for compactification.
   * When provided, replaces the default summarizer entirely.
   * Receives all messages and must return the compacted message list.
   */
  compactify?: (messages: UIMessage[]) => Promise<UIMessage[]>;

  /**
   * The model to use for summarization (same type as streamText's `model` param).
   * Required unless a custom `compactify` function is provided.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summaryModel?: any;

  /**
   * Custom token estimator function.
   * Given a UIMessage[], returns an estimated token count.
   * @default Character-based heuristic (~4 chars per token)
   */
  estimateTokens?: (messages: UIMessage[]) => number;
}

// ── State ──────────────────────────────────────────────────────────────

export interface ContextState {
  /** Total input tokens consumed across all LLM calls in this chat */
  totalInputTokens: number;
  /** Total output tokens consumed across all LLM calls in this chat */
  totalOutputTokens: number;
  /** Estimated current context size (tokens for the next LLM call) */
  estimatedContextSize: number;
  /** The configured maximum context window */
  maxTokens: number;
  /** Usage ratio (estimatedContextSize / effectiveBudget), clamped 0–1 */
  usageRatio: number;
  /** Whether the soft threshold has been exceeded */
  softThresholdExceeded: boolean;
  /** Whether the hard threshold has been exceeded */
  hardThresholdExceeded: boolean;
  /** Number of context-summary messages found in the chat */
  summaryCount: number;
}

// ── Summary Message Metadata ───────────────────────────────────────────

export interface ContextSummaryMetadata {
  type: "context-summary";
  /** Number of messages that were summarized */
  messagesSummarized: number;
  /** Estimated tokens of the original messages that were summarized */
  originalTokens: number;
  /** Estimated tokens of the summary */
  summaryTokens: number;
  /** ISO timestamp of when the summary was created */
  createdAt: string;
}

// ── Per-message context metadata ───────────────────────────────────────

export interface ContextMessageMetadata {
  context?: {
    /** Input tokens used by this specific LLM call */
    inputTokens?: number;
    /** Output tokens used by this specific LLM call */
    outputTokens?: number;
    /** Cumulative total tokens consumed in this chat so far */
    totalTokens?: number;
    /** Current usage ratio at completion (0–1) */
    usageRatio?: number;
  };
}

// ── The Context Manager Interface ──────────────────────────────────────

export interface ContextManager {
  /** Get the current context state. */
  getState(): ContextState;

  /**
   * Record token usage from a completed LLM step.
   * Called from onStepFinish or onFinish callbacks.
   */
  recordUsage(usage: { inputTokens?: number; outputTokens?: number }): void;

  /**
   * Update the estimated context size based on current messages.
   * Should be called whenever the message list changes.
   */
  updateEstimate(messages: UIMessage[]): void;

  /**
   * Prepare messages for the LLM call.
   * - Finds the last context-summary message
   * - Drops all messages before it
   * - Injects the summary text into the system prompt
   * - Returns the trimmed messages and updated system prompt
   *
   * Does NOT mutate the input array.
   */
  prepareMessages(
    messages: UIMessage[],
    systemPrompt: string
  ): Promise<{ messages: UIMessage[]; systemPrompt: string }>;

  /**
   * Returns true if estimated context exceeds the hard threshold.
   * Indicates compactification should block before the next LLM call.
   */
  shouldCompactify(messages: UIMessage[]): boolean;

  /**
   * Returns true if estimated context exceeds the soft threshold
   * but not the hard threshold.
   * Indicates background summarization should be triggered.
   */
  shouldSummarize(messages: UIMessage[]): boolean;

  /**
   * Perform compactification (synchronous in the request flow).
   * Returns a new message array with a summary message inserted
   * and older messages removed. Does NOT mutate the input.
   */
  compactify(messages: UIMessage[]): Promise<UIMessage[]>;

  /**
   * Get context metadata to attach to the streamed response.
   * Used with toUIMessageStreamResponse's messageMetadata callback.
   */
  getMessageMetadata(): ContextMessageMetadata;

  /** Reset internal state (e.g. when starting a new chat). */
  reset(): void;
}
