import type { UIMessage } from "ai";

/** Approximate characters per token for mixed English text and code. */
const CHARS_PER_TOKEN = 4;

/** Overhead tokens added per message (role, framing). */
const MESSAGE_OVERHEAD = 4;

/** Base overhead for the conversation itself. */
const CONVERSATION_OVERHEAD = 3;

/**
 * Estimate the token count of a UIMessage array using a character-based heuristic.
 *
 * This is intentionally model-agnostic (~4 chars per token) and errs slightly
 * on the conservative side. Pass a custom `estimateTokens` to
 * `createContextManager` if you need model-specific accuracy.
 */
export function estimateTokens(messages: UIMessage[]): number {
  let totalChars = 0;

  for (const msg of messages) {
    totalChars += MESSAGE_OVERHEAD * CHARS_PER_TOKEN; // per-message overhead

    for (const part of msg.parts) {
      switch (part.type) {
        case "text":
          totalChars += ((part as { text: string }).text ?? "").length;
          break;

        case "tool-invocation": {
          // Estimate from the serialised input + output
          const inv = part as {
            toolName?: string;
            input?: unknown;
            output?: unknown;
          };
          if (inv.toolName) totalChars += inv.toolName.length;
          if (inv.input) totalChars += JSON.stringify(inv.input).length;
          if (inv.output) totalChars += JSON.stringify(inv.output).length;
          break;
        }

        case "file": {
          // Only count the URL length (actual file content is handled by the provider)
          const file = part as { url?: string };
          totalChars += (file.url ?? "").length;
          break;
        }

        default:
          // Catch-all for unknown part types
          try {
            totalChars += JSON.stringify(part).length;
          } catch {
            totalChars += 50; // small fallback
          }
      }
    }
  }

  return Math.ceil(totalChars / CHARS_PER_TOKEN) + CONVERSATION_OVERHEAD;
}
