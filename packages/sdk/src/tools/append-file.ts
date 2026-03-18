import { tool, jsonSchema } from "ai";
import { appendFile as fsAppendFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface AppendFileToolOptions {
  /** Base directory for resolving relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
}

export interface AppendFileToolResult {
  path: string;
  bytesAppended: number;
}

/**
 * Create an appendFile tool that appends content to existing files.
 *
 * More token-efficient than read-concat-write for incremental file building
 * (logs, CSVs, reports). Creates the file if it doesn't exist.
 *
 * @example
 * ```ts
 * import { createAppendFileTool } from '@supyagent/sdk';
 *
 * const tools = {
 *   appendFile: createAppendFileTool({ cwd: '/path/to/project' }),
 * };
 * ```
 */
export function createAppendFileTool(options?: AppendFileToolOptions) {
  const cwd = options?.cwd ?? process.cwd();

  const schema = {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description:
          "File path to append to (absolute or relative to working directory). Created if it doesn't exist.",
      },
      content: {
        type: "string",
        description:
          "Content to append to the end of the file. Include a leading newline if you want separation from existing content.",
      },
    },
    required: ["path", "content"],
  };

  return tool({
    description:
      "Append content to the end of a file. Creates the file if it doesn't exist. More efficient than reading a file and rewriting it — use this for building up logs, CSVs, reports, or any file where you only need to add content.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args): Promise<AppendFileToolResult | { error: string }> => {
      const { path: filePath, content } = args as {
        path: string;
        content: string;
      };

      const fullPath = resolve(cwd, filePath);

      try {
        await fsAppendFile(fullPath, content, "utf-8");
        return {
          path: filePath,
          bytesAppended: Buffer.byteLength(content, "utf-8"),
        };
      } catch (err: unknown) {
        return { error: `Failed to append to file: ${(err as Error).message}` };
      }
    },
  });
}
