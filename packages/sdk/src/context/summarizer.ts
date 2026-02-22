import { generateText, type UIMessage } from "ai";

const DEFAULT_SUMMARY_PROMPT = `You are a conversation summariser. Produce a concise summary of the conversation below.

Focus on:
1. Key topics discussed and decisions made
2. Tasks completed and their outcomes (including important IDs, names, or values)
3. Pending tasks or open questions
4. Any in-progress multi-step work the assistant was performing

Be concise but preserve all actionable information. Output only the summary text, no preamble.`;

const MID_CHAIN_ADDENDUM = `\n\nIMPORTANT: The assistant was in the middle of executing a multi-step task when this summary was requested. Make sure to clearly note what step it was on and what remains to be done, so the task can be resumed seamlessly.`;

/**
 * Summarise a list of UIMessages into a single prose block
 * using an LLM call via the AI SDK's `generateText`.
 */
export async function summarize(
  messages: UIMessage[],
  options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any;
    prompt?: string;
    /** Set to true when compacting mid-tool-chain */
    midChain?: boolean;
  }
): Promise<string> {
  const conversationText = formatConversation(messages);

  let systemPrompt = options.prompt ?? DEFAULT_SUMMARY_PROMPT;
  if (options.midChain) {
    systemPrompt += MID_CHAIN_ADDENDUM;
  }

  const { text } = await generateText({
    model: options.model,
    system: systemPrompt,
    prompt: conversationText,
  });

  return text;
}

/** Convert UIMessage[] into a plain-text conversation transcript for the summariser. */
function formatConversation(messages: UIMessage[]): string {
  const lines: string[] = [];

  for (const msg of messages) {
    const role = msg.role.toUpperCase();
    const textParts: string[] = [];
    const toolParts: string[] = [];

    for (const part of msg.parts) {
      if (part.type === "text") {
        const text = (part as { text: string }).text;
        if (text?.trim()) textParts.push(text.trim());
      } else if (part.type === "tool-invocation") {
        const inv = part as { toolName?: string; output?: unknown; state?: string };
        const name = inv.toolName ?? "unknown";
        const state = inv.state ?? "";
        if (state === "output-available" && inv.output != null) {
          const outputStr =
            typeof inv.output === "string"
              ? inv.output
              : JSON.stringify(inv.output, null, 0);
          // Truncate very large outputs to keep the summariser prompt reasonable
          const truncated =
            outputStr.length > 2000
              ? outputStr.slice(0, 2000) + "... (truncated)"
              : outputStr;
          toolParts.push(`[Tool: ${name} → ${truncated}]`);
        } else {
          toolParts.push(`[Tool: ${name} (${state || "pending"})]`);
        }
      }
    }

    const content = [...textParts, ...toolParts].join("\n");
    if (content.trim()) {
      lines.push(`${role}: ${content}`);
    }
  }

  return lines.join("\n\n");
}
