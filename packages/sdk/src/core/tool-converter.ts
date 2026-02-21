import { tool, jsonSchema } from "ai";
import type { OpenAITool } from "./types.js";
import { createExecutor } from "./http-executor.js";

/**
 * Converts an array of OpenAI-format tools from the supyagent API
 * into a Record of AI SDK tool() instances ready for streamText/generateText.
 */
export function convertTools(
  tools: OpenAITool[],
  baseUrl: string,
  apiKey: string
): Record<string, import("ai").Tool> {
  const result: Record<string, import("ai").Tool> = {};

  for (const t of tools) {
    const { name, description, parameters } = t.function;
    const metadata = t.metadata;

    result[name] = tool({
      description,
      inputSchema: jsonSchema(parameters as Parameters<typeof jsonSchema>[0]),
      execute: async (args) => createExecutor(metadata, baseUrl, apiKey)(args as Record<string, unknown>),
    });
  }

  return result;
}

/**
 * Filter tools by provider, service, or tool name.
 */
export function filterTools(
  tools: OpenAITool[],
  options: { only?: string[]; except?: string[] }
): OpenAITool[] {
  let filtered = tools;

  if (options.only && options.only.length > 0) {
    const onlySet = new Set(options.only.map((s) => s.toLowerCase()));
    filtered = filtered.filter((t) => {
      const name = t.function.name.toLowerCase();
      const provider = t.metadata.provider.toLowerCase();
      const service = t.metadata.service.toLowerCase();
      return onlySet.has(name) || onlySet.has(provider) || onlySet.has(service);
    });
  }

  if (options.except && options.except.length > 0) {
    const exceptSet = new Set(options.except.map((s) => s.toLowerCase()));
    filtered = filtered.filter((t) => {
      const name = t.function.name.toLowerCase();
      const provider = t.metadata.provider.toLowerCase();
      const service = t.metadata.service.toLowerCase();
      return (
        !exceptSet.has(name) &&
        !exceptSet.has(provider) &&
        !exceptSet.has(service)
      );
    });
  }

  return filtered;
}
