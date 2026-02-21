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

/** A parsed skill section from the aggregated SKILL.md */
export interface ParsedSkill {
  /** Display name, e.g. "Gmail", "Calendar", "Slack" */
  name: string;
  /** The full markdown content for this skill section */
  content: string;
}

/** The parsed result of the aggregated skills markdown */
export interface ParsedSkillsDocument {
  /** YAML frontmatter fields */
  frontmatter: { name: string; description: string };
  /** The preamble text (between frontmatter and first ---) */
  preamble: string;
  /** Individual skill sections split on \n---\n */
  skills: ParsedSkill[];
}

/** Options for the skills() method */
export interface SkillsOptions {
  /** Cache TTL in seconds. true = 60s, number = custom TTL, false/undefined = no cache */
  cache?: boolean | number;
}

/** Return type of client.skills() */
export interface SkillsResult {
  /** System prompt text with skill summaries for the LLM */
  systemPrompt: string;
  /** Tool objects: loadSkill and apiCall */
  tools: Record<string, import("ai").Tool>;
}

/** The supyagent client interface */
export interface SupyagentClient {
  tools(options?: ToolFilterOptions): Promise<Record<string, import("ai").Tool>>;
  skills(options?: SkillsOptions): Promise<SkillsResult>;
}
