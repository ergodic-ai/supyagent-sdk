import { tool, jsonSchema } from "ai";
import { open } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_MAX_LINES = 200;

export interface ReadFileRangeToolOptions {
  /** Base directory for resolving relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Maximum number of lines that can be requested at once. Defaults to 200. */
  maxLines?: number;
}

export interface ReadFileRangeToolResult {
  path: string;
  content: string;
  startLine: number;
  endLine: number;
  totalLines: number;
}

/**
 * Create a readFileRange tool that reads specific line ranges from files.
 *
 * More token-efficient than reading entire files — especially useful
 * after a grep to read context around a match.
 *
 * @example
 * ```ts
 * import { createReadFileRangeTool } from '@supyagent/sdk';
 *
 * const tools = {
 *   readFileRange: createReadFileRangeTool({ cwd: '/path/to/project' }),
 * };
 * ```
 */
export function createReadFileRangeTool(options?: ReadFileRangeToolOptions) {
  const cwd = options?.cwd ?? process.cwd();
  const maxLines = options?.maxLines ?? DEFAULT_MAX_LINES;

  const schema = {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description:
          "File path to read (absolute or relative to working directory)",
      },
      startLine: {
        type: "number",
        description: "First line to read (1-based, inclusive). Defaults to 1.",
      },
      endLine: {
        type: "number",
        description:
          "Last line to read (1-based, inclusive). Defaults to startLine + 200.",
      },
    },
    required: ["path"],
  };

  return tool({
    description:
      "Read a specific range of lines from a file, with line numbers. More efficient than reading entire files — use this after grep to read context around matches, or to inspect specific sections of large files.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (
      args,
    ): Promise<ReadFileRangeToolResult | { error: string }> => {
      const { path: filePath, startLine, endLine } = args as {
        path: string;
        startLine?: number;
        endLine?: number;
      };

      const fullPath = resolve(cwd, filePath);
      const start = Math.max(1, startLine ?? 1);
      const requestedEnd = endLine ?? start + maxLines - 1;
      const end = Math.min(requestedEnd, start + maxLines - 1);

      let fh;
      try {
        fh = await open(fullPath, "r");
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          return { error: `File not found: ${filePath}` };
        }
        return { error: `Failed to open file: ${(err as Error).message}` };
      }

      try {
        const lines: string[] = [];
        let lineNum = 0;

        for await (const line of fh.readLines()) {
          lineNum++;
          if (lineNum > end) break;
          if (lineNum >= start) {
            lines.push(`${lineNum}\t${line}`);
          }
        }

        if (lines.length === 0 && start > 1) {
          return {
            error: `File only has ${lineNum} lines. Requested start line: ${start}.`,
          };
        }

        return {
          path: filePath,
          content: lines.join("\n"),
          startLine: start,
          endLine: Math.min(end, lineNum),
          totalLines: lineNum,
        };
      } finally {
        await fh.close();
      }
    },
  });
}
