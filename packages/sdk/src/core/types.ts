/** Mirrors the ToolSchema.metadata from supyagent_service tool-schemas.ts */
export interface ToolMetadata {
  provider: string;
  service: string;
  permission: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  bodyDefaults?: Record<string, string>;
  category?: string;
  tags?: string[];
}

/** A single tool as returned by the /api/v1/tools endpoint */
export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
  metadata: ToolMetadata;
}

/** Response shape from GET /api/v1/tools */
export interface ToolsResponse {
  tools: OpenAITool[];
  base_url: string;
  total: number;
}

/** Options for the supyagent() factory */
export interface SupyagentOptions {
  apiKey: string;
  baseUrl?: string;
}

/** Options for the tools() method */
export interface ToolFilterOptions {
  /** Filter to only these providers, services, or tool names */
  only?: string[];
  /** Exclude these providers, services, or tool names */
  except?: string[];
  /** Cache TTL in seconds. true = 60s, number = custom TTL, false/undefined = no cache */
  cache?: boolean | number;
}

/** The supyagent client interface */
export interface SupyagentClient {
  tools(options?: ToolFilterOptions): Promise<Record<string, unknown>>;
}
