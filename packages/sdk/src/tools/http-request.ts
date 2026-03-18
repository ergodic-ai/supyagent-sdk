import { tool, jsonSchema } from "ai";

const DEFAULT_TIMEOUT = 30_000;
const MAX_RESPONSE_SIZE = 100_000;

export interface HttpRequestToolOptions {
  /** Default timeout in milliseconds. Defaults to 30000 (30s). */
  timeout?: number;
  /** Maximum response body size in characters. Defaults to 100000. */
  maxResponseSize?: number;
  /** Default headers to include in every request. */
  defaultHeaders?: Record<string, string>;
}

export interface HttpRequestToolResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  truncated: boolean;
}

/**
 * Create an httpRequest tool for making HTTP requests.
 *
 * Supports GET, POST, PUT, PATCH, DELETE with headers, body, and
 * parsed JSON responses. Cleaner than composing curl commands via bash.
 *
 * @example
 * ```ts
 * import { createHttpRequestTool } from '@supyagent/sdk';
 *
 * const tools = {
 *   httpRequest: createHttpRequestTool({
 *     defaultHeaders: { 'Authorization': 'Bearer ...' },
 *   }),
 * };
 * ```
 */
export function createHttpRequestTool(options?: HttpRequestToolOptions) {
  const defaultTimeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxResponseSize = options?.maxResponseSize ?? MAX_RESPONSE_SIZE;
  const defaultHeaders = options?.defaultHeaders ?? {};

  const schema = {
    type: "object" as const,
    properties: {
      url: {
        type: "string",
        description: "The URL to request (must include protocol, e.g. https://)",
      },
      method: {
        type: "string",
        description: "HTTP method. Defaults to GET.",
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
      },
      headers: {
        type: "object",
        description:
          "Request headers as key-value pairs, e.g. { \"Content-Type\": \"application/json\" }",
        additionalProperties: { type: "string" },
      },
      body: {
        type: "string",
        description:
          "Request body as a string. For JSON, stringify the object first.",
      },
      timeout: {
        type: "number",
        description: "Request timeout in milliseconds. Defaults to 30000.",
      },
    },
    required: ["url"],
  };

  return tool({
    description:
      "Make an HTTP request to any URL. Supports GET, POST, PUT, PATCH, DELETE with custom headers and body. Returns status code, headers, and response body. Use this for calling APIs, checking endpoints, fetching data, or sending webhooks.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args): Promise<HttpRequestToolResult | { error: string }> => {
      const {
        url,
        method,
        headers,
        body,
        timeout: reqTimeout,
      } = args as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        timeout?: number;
      };

      const effectiveTimeout = reqTimeout ?? defaultTimeout;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), effectiveTimeout);

        const start = Date.now();

        const response = await fetch(url, {
          method: method ?? "GET",
          headers: { ...defaultHeaders, ...headers },
          body: body ?? undefined,
          signal: controller.signal,
        });

        const durationMs = Date.now() - start;
        clearTimeout(timer);

        // Extract response headers as plain object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Read body as text
        let responseBody = await response.text();
        const truncated = responseBody.length > maxResponseSize;
        if (truncated) {
          responseBody = responseBody.slice(0, maxResponseSize) + "\n... (truncated)";
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          durationMs,
          truncated,
        };
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return { error: `Request timed out after ${effectiveTimeout}ms` };
        }
        return { error: `Request failed: ${(err as Error).message}` };
      }
    },
  });
}
