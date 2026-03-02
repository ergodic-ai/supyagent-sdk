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
  /** Whether the user has the required integration connected. Present on all tool discovery endpoints. */
  connected?: boolean;
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

/** Options for the me() method */
export interface MeOptions {
  /** Cache TTL in seconds. true = 60s, number = custom TTL, false/undefined = no cache */
  cache?: boolean | number;
}

/** Response shape from GET /api/v1/me */
export interface MeResponse {
  email: string | null;
  tier: string;
  usage: {
    current: number;
    /** -1 means unlimited (enterprise) */
    limit: number;
  };
  integrations: Array<{
    provider: string;
    status: string;
  }>;
  dashboardUrl: string;
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

// ── Tool Discovery ───────────────────────────────────────────────────────────

/** A tool with a relevance score, returned by search endpoints */
export interface ScoredTool extends OpenAITool {
  score: number;
}

/** Response from search endpoints (/tools/search, /tools/names) */
export interface ToolSearchResponse {
  tools: ScoredTool[];
  total: number;
}

/** Response from filter endpoints (/tools/provider, /tools/service) */
export interface ToolListResponse {
  tools: OpenAITool[];
  total: number;
}

// ── Connected Accounts ───────────────────────────────────────────────────────

/** A connected account (end-user of the partner) */
export interface ConnectedAccount {
  id: string;
  externalId: string;
  displayName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** A connected account with its integrations */
export interface ConnectedAccountWithIntegrations extends ConnectedAccount {
  integrations: AccountIntegration[];
}

/** A single integration on a connected account */
export interface AccountIntegration {
  id: string;
  provider: string;
  status: string;
  connectedAt: string;
}

/** An integration with its enabled services */
export interface AccountIntegrationDetail extends AccountIntegration {
  enabledServices: Array<{
    serviceName: string;
    isEnabled: boolean;
  }>;
}

/** Options for creating a connected account */
export interface CreateAccountOptions {
  externalId: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
}

/** Options for updating a connected account */
export interface UpdateAccountOptions {
  displayName?: string;
  metadata?: Record<string, unknown>;
}

/** Options for listing connected accounts */
export interface ListAccountsOptions {
  limit?: number;
  offset?: number;
}

/** Paginated response from accounts.list() */
export interface ListAccountsResponse {
  accounts: ConnectedAccount[];
  total: number;
  limit: number;
  offset: number;
}

/** Options for initiating an OAuth connect session */
export interface ConnectOptions {
  provider: string;
  redirectUrl: string;
  scopes?: string[];
}

/** Response from accounts.connect() */
export interface ConnectSession {
  connectUrl: string;
  sessionId: string;
  expiresAt: string;
}

/** Response from accounts.getSession() */
export interface ConnectSessionStatus {
  sessionId: string;
  provider: string;
  status: string;
  error?: string;
  createdAt: string;
  expiresAt: string;
}

/** The accounts sub-client */
export interface AccountsClient {
  create(options: CreateAccountOptions): Promise<ConnectedAccount>;
  list(options?: ListAccountsOptions): Promise<ListAccountsResponse>;
  get(id: string): Promise<ConnectedAccountWithIntegrations>;
  update(id: string, options: UpdateAccountOptions): Promise<ConnectedAccount>;
  delete(id: string): Promise<{ deleted: true }>;
  connect(id: string, options: ConnectOptions): Promise<ConnectSession>;
  getSession(id: string, sessionId: string): Promise<ConnectSessionStatus>;
  integrations(id: string): Promise<AccountIntegrationDetail[]>;
  disconnect(id: string, provider: string): Promise<{ deleted: true; provider: string }>;
}

/** Client scoped to a specific connected account. Sends X-Account-Id on all requests. */
export interface ScopedClient {
  /** The external ID this client is scoped to */
  readonly accountId: string;
  tools(options?: ToolFilterOptions): Promise<Record<string, import("ai").Tool>>;
  skills(options?: SkillsOptions): Promise<SkillsResult>;
  me(options?: MeOptions): Promise<MeResponse>;
  /** Fuzzy search across tool names and descriptions. Returns scored results. */
  searchTools(query: string): Promise<ToolSearchResponse>;
  /** Get all tools for a specific provider (e.g. "google", "slack"). */
  toolsByProvider(provider: string): Promise<ToolListResponse>;
  /** Get all tools for a specific service (e.g. "gmail", "calendar"). */
  toolsByService(service: string): Promise<ToolListResponse>;
}

/** The supyagent client interface */
export interface SupyagentClient {
  tools(options?: ToolFilterOptions): Promise<Record<string, import("ai").Tool>>;
  skills(options?: SkillsOptions): Promise<SkillsResult>;
  me(options?: MeOptions): Promise<MeResponse>;
  /** Fuzzy search across tool names and descriptions. Returns scored results. */
  searchTools(query: string): Promise<ToolSearchResponse>;
  /** Get all tools for a specific provider (e.g. "google", "slack"). */
  toolsByProvider(provider: string): Promise<ToolListResponse>;
  /** Get all tools for a specific service (e.g. "gmail", "calendar"). */
  toolsByService(service: string): Promise<ToolListResponse>;
  accounts: AccountsClient;
  /** Returns a client scoped to a connected account. All requests include X-Account-Id. */
  asAccount(externalId: string): ScopedClient;
}
