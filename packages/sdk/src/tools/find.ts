import { tool, jsonSchema } from "ai";
import { exec } from "node:child_process";
import { resolve } from "node:path";

const DEFAULT_TIMEOUT = 15_000;
const MAX_OUTPUT = 30_000;

export interface FindToolOptions {
  /** Base directory for searching. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Timeout in milliseconds. Defaults to 15000 (15s). */
  timeout?: number;
  /** Maximum output length in characters. Defaults to 30000. */
  maxOutput?: number;
}

export interface FindToolResult {
  files: string[];
  count: number;
  truncated: boolean;
}

/**
 * Create a find tool for discovering files by name or glob pattern.
 *
 * Uses `find` under the hood with common ignore patterns
 * (node_modules, .git, dist, etc.) pre-configured.
 *
 * @example
 * ```ts
 * import { createFindTool } from '@supyagent/sdk';
 *
 * const tools = {
 *   find: createFindTool({ cwd: '/path/to/project' }),
 * };
 * ```
 */
export function createFindTool(options?: FindToolOptions) {
  const cwd = options?.cwd ?? process.cwd();
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxOutput = options?.maxOutput ?? MAX_OUTPUT;

  const schema = {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description:
          'File name or glob pattern to search for, e.g. "*.ts", "config.json", "README*"',
      },
      path: {
        type: "string",
        description:
          "Directory to search in (relative to working directory). Defaults to current directory.",
      },
      type: {
        type: "string",
        description:
          'Filter by type: "f" for files only, "d" for directories only. Defaults to both.',
        enum: ["f", "d"],
      },
      maxDepth: {
        type: "number",
        description: "Maximum directory depth to search. Defaults to no limit.",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return. Defaults to 200.",
      },
    },
    required: ["pattern"],
  };

  const IGNORE_DIRS = [
    "node_modules", ".git", "dist", "build", ".next", "__pycache__",
    ".venv", "venv", ".cache", "coverage", ".turbo",
  ];

  return tool({
    description:
      "Find files and directories by name or glob pattern. Returns matching paths relative to the working directory. Automatically ignores common directories (node_modules, .git, dist, etc.).",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args): Promise<FindToolResult | { error: string }> => {
      const {
        pattern,
        path: searchPath,
        type: fileType,
        maxDepth,
        maxResults,
      } = args as {
        pattern: string;
        path?: string;
        type?: "f" | "d";
        maxDepth?: number;
        maxResults?: number;
      };

      const target = resolve(cwd, searchPath ?? ".");
      const limit = maxResults ?? 200;

      // Build find command with ignore patterns
      const pruneExpr = IGNORE_DIRS
        .map(d => `-name '${d}' -prune`)
        .join(" -o ");

      const parts = [
        `find '${target}'`,
        `\\( ${pruneExpr} \\)`,
        `-o -name '${pattern.replace(/'/g, "'\\''")}'`,
      ];

      if (fileType) parts.push(`-type ${fileType}`);
      parts.push("-print");
      parts.push(`| head -n ${limit}`);

      if (maxDepth !== undefined) {
        // Insert maxdepth right after the target path
        parts.splice(1, 0, `-maxdepth ${maxDepth}`);
      }

      const command = parts.join(" ");

      return new Promise<FindToolResult | { error: string }>((resolvePromise) => {
        exec(
          command,
          {
            cwd,
            timeout,
            maxBuffer: 10 * 1024 * 1024,
            env: { ...process.env, TERM: "dumb" },
          },
          (error, stdout) => {
            if (error?.killed) {
              resolvePromise({ error: "Search timed out" });
              return;
            }

            // find may return non-zero with permission errors — still return results
            const output = stdout.trim();
            if (!output) {
              resolvePromise({ files: [], count: 0, truncated: false });
              return;
            }

            const truncated = output.length > maxOutput;
            const raw = truncated ? output.slice(0, maxOutput) : output;
            const files = raw.split("\n").filter(Boolean);

            resolvePromise({
              files,
              count: files.length,
              truncated: truncated || files.length >= limit,
            });
          }
        );
      });
    },
  });
}
