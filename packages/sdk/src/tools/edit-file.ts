import { tool, jsonSchema } from "ai";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface EditFileToolOptions {
  /** Base directory for resolving relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Maximum file size in bytes that can be edited. Defaults to 1MB. */
  maxFileSize?: number;
}

export interface EditFileToolResult {
  path: string;
  replacements: number;
}

/**
 * Create an editFile tool that patches files using search-and-replace.
 *
 * Unlike a full-file write, this lets the LLM send only the changed sections,
 * saving tokens and reducing the risk of accidentally dropping content.
 *
 * @example
 * ```ts
 * import { createEditFileTool } from '@supyagent/sdk';
 *
 * const tools = {
 *   editFile: createEditFileTool({ cwd: '/path/to/project' }),
 * };
 * ```
 */
export function createEditFileTool(options?: EditFileToolOptions) {
  const cwd = options?.cwd ?? process.cwd();
  const maxFileSize = options?.maxFileSize ?? 1_048_576;

  const schema = {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description:
          "File path to edit (absolute or relative to working directory)",
      },
      edits: {
        type: "array",
        description:
          "Array of search-and-replace operations applied sequentially. Each edit replaces the first occurrence of oldText with newText.",
        items: {
          type: "object",
          properties: {
            oldText: {
              type: "string",
              description: "The exact text to find in the file",
            },
            newText: {
              type: "string",
              description: "The replacement text",
            },
          },
          required: ["oldText", "newText"],
        },
      },
    },
    required: ["path", "edits"],
  };

  return tool({
    description:
      "Edit a file by applying one or more search-and-replace operations. Each edit replaces the first occurrence of oldText with newText. More efficient than rewriting entire files — only send the changed parts. Returns an error with the current file content if any oldText is not found.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args): Promise<EditFileToolResult | { error: string; currentContent?: string }> => {
      const { path: filePath, edits } = args as {
        path: string;
        edits: Array<{ oldText: string; newText: string }>;
      };

      const fullPath = resolve(cwd, filePath);

      let content: string;
      try {
        const buf = await readFile(fullPath);
        if (buf.length > maxFileSize) {
          return { error: `File too large (${buf.length} bytes). Max: ${maxFileSize} bytes.` };
        }
        content = buf.toString("utf-8");
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          return { error: `File not found: ${filePath}` };
        }
        return { error: `Failed to read file: ${(err as Error).message}` };
      }

      let replacements = 0;
      for (const edit of edits) {
        const idx = content.indexOf(edit.oldText);
        if (idx === -1) {
          return {
            error: `oldText not found in file — it may have been modified. Re-read the file and retry.\n\nSearched for:\n${edit.oldText}`,
            currentContent: content,
          };
        }
        content = content.slice(0, idx) + edit.newText + content.slice(idx + edit.oldText.length);
        replacements++;
      }

      await writeFile(fullPath, content, "utf-8");
      return { path: filePath, replacements };
    },
  });
}
