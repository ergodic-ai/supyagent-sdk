import { tool, jsonSchema } from "ai";

export interface ViewImageToolOptions {
  /**
   * Custom description for the tool.
   * @default "Display an image in the chat. Use this when you want to show the user an image from a URL."
   */
  description?: string;
}

export interface ViewImageToolResult {
  url: string;
  displayed: true;
}

/**
 * Create a viewImage tool that the agent can call to display an image in the chat.
 *
 * On the client side, pair this with the `useViewImageEffect` hook (or equivalent logic)
 * to inject the image as a `FileUIPart` into the conversation. This ensures the image
 * is visible to both the user (rendered as `<img>`) and the model (via `convertToModelMessages`).
 */
export function createViewImageTool(options?: ViewImageToolOptions) {
  const schema = {
    type: "object" as const,
    properties: {
      url: {
        type: "string",
        description: "The URL of the image to display",
      },
    },
    required: ["url"],
  };

  return tool({
    description:
      options?.description ??
      "Display an image in the chat. Use this when you want to show the user an image from a URL.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args): Promise<ViewImageToolResult> => {
      const { url } = args as { url: string };
      return { url, displayed: true };
    },
  });
}
