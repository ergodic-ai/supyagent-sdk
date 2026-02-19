import type { ToolMetadata } from "./types.js";

/**
 * Creates an execute function for a tool that calls the supyagent API.
 *
 * Handles:
 * - Path parameter substitution (e.g., {messageId} in /api/v1/gmail/messages/{messageId})
 * - GET/DELETE: remaining args → query string
 * - POST/PUT/PATCH: merge bodyDefaults + remaining args → JSON body
 */
export function createExecutor(
  metadata: ToolMetadata,
  baseUrl: string,
  apiKey: string
): (args: Record<string, unknown>) => Promise<unknown> {
  return async (args: Record<string, unknown>) => {
    const { method, path, bodyDefaults } = metadata;

    // Extract path parameters and substitute into the path
    const remainingArgs = { ...args };
    let resolvedPath = path;

    const pathParams = path.match(/\{(\w+)\}/g);
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.slice(1, -1);
        if (paramName in remainingArgs) {
          resolvedPath = resolvedPath.replace(
            param,
            encodeURIComponent(String(remainingArgs[paramName]))
          );
          delete remainingArgs[paramName];
        }
      }
    }

    let url = `${baseUrl}${resolvedPath}`;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    };

    if (method === "GET" || method === "DELETE") {
      // Remaining args go as query parameters
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(remainingArgs)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    } else {
      // POST/PUT/PATCH: merge bodyDefaults with remaining args
      const body = { ...bodyDefaults, ...remainingArgs };
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    return data;
  };
}
