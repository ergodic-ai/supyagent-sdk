import { tool, jsonSchema } from "ai";
import { exec } from "node:child_process";
import { resolve } from "node:path";

const MAX_OUTPUT = 30_000;
const DEFAULT_TIMEOUT = 15_000;

export interface GrepToolOptions {
  /** Base directory for searching. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Timeout in milliseconds. Defaults to 15000 (15s). */
  timeout?: number;
  /** Maximum output length in characters. Defaults to 30000. */
  maxOutput?: number;
}

export interface GrepToolResult {
  matches: string;
  matchCount: number;
  truncated: boolean;
}

/**
 * Create a grep tool for searching file contents by pattern.
 *
 * Uses `grep -rn` (or `rg` if available) under the hood.
 * Returns matching lines with file paths and line numbers.
 *
 * @example
 * ```ts
 * import { createGrepTool } from '@supyagent/sdk';
 *
 * const tools = {
 *   grep: createGrepTool({ cwd: '/path/to/project' }),
 * };
 * ```
 */
export function createGrepTool(options?: GrepToolOptions) {
  const cwd = options?.cwd ?? process.cwd();
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxOutput = options?.maxOutput ?? MAX_OUTPUT;

  const schema = {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description: "Search pattern (regular expression)",
      },
      path: {
        type: "string",
        description:
          "File or directory to search in (relative to working directory). Defaults to current directory.",
      },
      include: {
        type: "string",
        description:
          'Glob pattern to filter files, e.g. "*.ts", "*.{js,jsx}". Only matching files are searched.',
      },
      ignoreCase: {
        type: "boolean",
        description: "Case-insensitive search. Defaults to false.",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of matching lines to return. Defaults to 100.",
      },
    },
    required: ["pattern"],
  };

  return tool({
    description:
      "Search file contents for a pattern (regular expression). Returns matching lines with file paths and line numbers. Useful for finding function definitions, usages, imports, config values, and more.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args): Promise<GrepToolResult | { error: string }> => {
      const {
        pattern,
        path: searchPath,
        include,
        ignoreCase,
        maxResults,
      } = args as {
        pattern: string;
        path?: string;
        include?: string;
        ignoreCase?: boolean;
        maxResults?: number;
      };

      const target = resolve(cwd, searchPath ?? ".");
      const limit = maxResults ?? 100;

      // Build command — prefer rg if available, fallback to grep
      const rgArgs = [
        "--no-heading",
        "--line-number",
        "--color=never",
        `-m ${limit}`,
      ];
      if (ignoreCase) rgArgs.push("-i");
      if (include) rgArgs.push(`--glob '${include}'`);

      const grepArgs = [
        "-rn",
        "--color=never",
        `-m ${limit}`,
      ];
      if (ignoreCase) grepArgs.push("-i");
      if (include) grepArgs.push(`--include='${include}'`);

      // Escape pattern for shell
      const escaped = pattern.replace(/'/g, "'\\''");

      const command =
        `rg ${rgArgs.join(" ")} '${escaped}' '${target}' 2>/dev/null || ` +
        `grep ${grepArgs.join(" ")} '${escaped}' '${target}' 2>/dev/null`;

      return new Promise<GrepToolResult | { error: string }>((resolvePromise) => {
        exec(
          command,
          {
            cwd,
            timeout,
            maxBuffer: 10 * 1024 * 1024,
            env: { ...process.env, TERM: "dumb" },
          },
          (error, stdout) => {
            // grep exits 1 when no matches — that's fine
            if (error && error.code !== 1 && !error.killed) {
              resolvePromise({ error: `Search failed: ${error.message}` });
              return;
            }

            if (error?.killed) {
              resolvePromise({ error: "Search timed out" });
              return;
            }

            const output = stdout.trim();
            if (!output) {
              resolvePromise({ matches: "", matchCount: 0, truncated: false });
              return;
            }

            const truncated = output.length > maxOutput;
            const matches = truncated ? output.slice(0, maxOutput) + "\n... (truncated)" : output;
            const matchCount = matches.split("\n").filter(Boolean).length;

            resolvePromise({ matches, matchCount, truncated });
          }
        );
      });
    },
  });
}
