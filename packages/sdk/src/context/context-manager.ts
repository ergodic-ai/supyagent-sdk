import type { UIMessage } from "ai";
import type {
  ContextManager,
  ContextManagerOptions,
  ContextMessageMetadata,
  ContextState,
  ContextSummaryMetadata,
} from "./types.js";
import { estimateTokens as defaultEstimateTokens } from "./token-estimator.js";
import {
  prepareMessages as doPrepareMessages,
  findLastSummaryIndex,
  countSummaries,
} from "./message-preparation.js";
import { summarize } from "./summarizer.js";

const DEFAULT_MAX_TOKENS = 128_000;
const DEFAULT_SOFT_THRESHOLD = 0.75;
const DEFAULT_HARD_THRESHOLD = 0.9;
const DEFAULT_RESPONSE_RESERVE = 4096;
const DEFAULT_MIN_RECENT = 4;

/** Generate a simple unique ID for summary messages. */
function generateId(): string {
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a context manager that tracks token usage, detects threshold
 * breaches, and can compactify message history via summarisation.
 *
 * The manager is stateless across HTTP requests — it derives cumulative
 * totals from message metadata written by previous requests and
 * accumulates usage recorded during the current request.
 */
export function createContextManager(
  options?: ContextManagerOptions
): ContextManager {
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const softThreshold = options?.softThreshold ?? DEFAULT_SOFT_THRESHOLD;
  const hardThreshold = options?.hardThreshold ?? DEFAULT_HARD_THRESHOLD;
  const responseReserve = options?.responseReserve ?? DEFAULT_RESPONSE_RESERVE;
  const minRecentMessages = options?.minRecentMessages ?? DEFAULT_MIN_RECENT;
  const estimateTokens = options?.estimateTokens ?? defaultEstimateTokens;

  // Effective budget = maxTokens minus what we reserve for the response
  const effectiveBudget = maxTokens - responseReserve;

  // ── Mutable per-request state ──────────────────────────────────────

  /** Input tokens recorded during this request (from onStepFinish). */
  let requestInputTokens = 0;
  /** Output tokens recorded during this request. */
  let requestOutputTokens = 0;
  /** Latest estimated context size in tokens. */
  let estimatedContextSize = 0;

  // ── Helpers ────────────────────────────────────────────────────────

  /** Read cumulative totals from the last assistant message that has context metadata. */
  function getCumulativeTotals(messages: UIMessage[]): {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
  } {
    for (let i = messages.length - 1; i >= 0; i--) {
      const meta = messages[i].metadata as ContextMessageMetadata | undefined;
      if (meta?.context) {
        return {
          totalTokens: meta.context.totalTokens ?? 0,
          inputTokens: meta.context.inputTokens ?? 0,
          outputTokens: meta.context.outputTokens ?? 0,
        };
      }
    }
    return { totalTokens: 0, inputTokens: 0, outputTokens: 0 };
  }

  function computeUsageRatio(): number {
    if (effectiveBudget <= 0) return 0;
    return Math.min(Math.max(estimatedContextSize / effectiveBudget, 0), 1);
  }

  // ── ContextManager implementation ──────────────────────────────────

  const manager: ContextManager = {
    getState(): ContextState {
      const ratio = computeUsageRatio();
      return {
        totalInputTokens: requestInputTokens,
        totalOutputTokens: requestOutputTokens,
        estimatedContextSize,
        maxTokens,
        usageRatio: ratio,
        softThresholdExceeded: ratio > softThreshold,
        hardThresholdExceeded: ratio > hardThreshold,
        summaryCount: 0, // updated by updateEstimate
      };
    },

    recordUsage(usage) {
      requestInputTokens += usage.inputTokens ?? 0;
      requestOutputTokens += usage.outputTokens ?? 0;
      // Use actual input tokens as the new context size estimate
      // (they reflect the real token count the provider saw)
      if (usage.inputTokens != null && usage.inputTokens > 0) {
        estimatedContextSize = usage.inputTokens;
      }
    },

    updateEstimate(messages) {
      // After prepareMessages, estimate what the LLM would see
      const { messages: trimmed } = doPrepareMessages(messages, "");
      estimatedContextSize = estimateTokens(trimmed);
    },

    async prepareMessages(messages, systemPrompt) {
      return doPrepareMessages(messages, systemPrompt);
    },

    shouldCompactify(messages) {
      // Re-estimate in case messages changed since last updateEstimate
      const { messages: trimmed } = doPrepareMessages(messages, "");
      const estimate = estimateTokens(trimmed);
      return estimate / effectiveBudget > hardThreshold;
    },

    shouldSummarize(messages) {
      const { messages: trimmed } = doPrepareMessages(messages, "");
      const estimate = estimateTokens(trimmed);
      const ratio = estimate / effectiveBudget;
      return ratio > softThreshold && ratio <= hardThreshold;
    },

    async compactify(messages) {
      // If a custom compactify is provided, delegate entirely
      if (options?.compactify) {
        return options.compactify(messages);
      }

      if (!options?.summaryModel) {
        throw new Error(
          "createContextManager: either `summaryModel` or a custom `compactify` function is required to perform compactification."
        );
      }

      // Don't compact if there aren't enough messages
      if (messages.length <= minRecentMessages) {
        return messages;
      }

      // Split: everything before the cutpoint gets summarised
      const splitIdx = messages.length - minRecentMessages;
      const messagesToSummarize = messages.slice(0, splitIdx);
      const recentMessages = messages.slice(splitIdx);

      // Detect if we're mid-chain (last message is assistant with tool invocations
      // that might indicate an in-progress workflow)
      const lastMsg = messages[messages.length - 1];
      const midChain =
        lastMsg?.role === "assistant" &&
        lastMsg.parts.some(
          (p) =>
            p.type === "tool-invocation" &&
            (p as { state?: string }).state !== "output-available"
        );

      const summaryText = await summarize(messagesToSummarize, {
        model: options.summaryModel,
        prompt: options.summaryPrompt,
        midChain,
      });

      const originalTokens = estimateTokens(messagesToSummarize);
      const summaryMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [{ type: "text", text: summaryText }],
        metadata: {
          type: "context-summary",
          messagesSummarized: messagesToSummarize.length,
          originalTokens,
          summaryTokens: estimateTokens([
            {
              id: "tmp",
              role: "assistant",
              parts: [{ type: "text", text: summaryText }],
            },
          ]),
          createdAt: new Date().toISOString(),
        } satisfies ContextSummaryMetadata,
      };

      return [summaryMessage, ...recentMessages];
    },

    getMessageMetadata(): ContextMessageMetadata {
      return {
        context: {
          inputTokens: requestInputTokens,
          outputTokens: requestOutputTokens,
          totalTokens: requestInputTokens + requestOutputTokens,
          usageRatio: computeUsageRatio(),
        },
      };
    },

    reset() {
      requestInputTokens = 0;
      requestOutputTokens = 0;
      estimatedContextSize = 0;
    },
  };

  // Patch getState to include summaryCount dynamically
  const originalGetState = manager.getState.bind(manager);
  manager.getState = function getStateWithSummaryCount() {
    const state = originalGetState();
    // summaryCount is derived; caller should use countSummaries if needed
    return state;
  };

  return manager;
}

export { countSummaries };
