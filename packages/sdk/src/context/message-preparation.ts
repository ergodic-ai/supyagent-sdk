import type { UIMessage } from "ai";
import type { ContextSummaryMetadata } from "./types.js";

const SUMMARY_PREAMBLE =
  "\n\n[Previous conversation summary]\nThe following is a summary of the conversation history that has been compacted to save context space:\n\n";

/**
 * Prepare messages for an LLM call by trimming everything before the last
 * context-summary message and injecting the summary into the system prompt.
 *
 * - If no summary exists, all messages pass through unchanged.
 * - If a summary exists at index `i`, messages `[0..i]` are dropped and the
 *   summary text is appended to the system prompt.
 *
 * Neither the input array nor any individual message is mutated.
 */
export function prepareMessages(
  messages: UIMessage[],
  systemPrompt: string
): { messages: UIMessage[]; systemPrompt: string } {
  const summaryIdx = findLastSummaryIndex(messages);

  if (summaryIdx === -1) {
    return { messages, systemPrompt };
  }

  const summaryMessage = messages[summaryIdx];
  const summaryText = extractSummaryText(summaryMessage);
  const trimmedMessages = messages.slice(summaryIdx + 1);

  return {
    messages: trimmedMessages,
    systemPrompt: systemPrompt + SUMMARY_PREAMBLE + summaryText,
  };
}

/**
 * Find the index of the last message that is a context summary.
 * Returns -1 if none found.
 */
export function findLastSummaryIndex(messages: UIMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const meta = messages[i].metadata as ContextSummaryMetadata | undefined;
    if (meta?.type === "context-summary") {
      return i;
    }
  }
  return -1;
}

/** Count how many context-summary messages exist in the array. */
export function countSummaries(messages: UIMessage[]): number {
  let count = 0;
  for (const msg of messages) {
    const meta = msg.metadata as ContextSummaryMetadata | undefined;
    if (meta?.type === "context-summary") count++;
  }
  return count;
}

/** Extract the text content from a summary message. */
function extractSummaryText(message: UIMessage): string {
  for (const part of message.parts) {
    if (part.type === "text") {
      return (part as { text: string }).text ?? "";
    }
  }
  return "";
}
