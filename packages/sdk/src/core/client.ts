import type {
  SupyagentOptions,
  SupyagentClient,
  ScopedClient,
  ToolFilterOptions,
  ToolsResponse,
  SkillsOptions,
  SkillsResult,
  ParsedSkillsDocument,
  MeOptions,
  MeResponse,
  AccountsClient,
  ConnectedAccount,
  ConnectedAccountWithIntegrations,
  ListAccountsResponse,
  ConnectSession,
  ConnectSessionStatus,
  AccountIntegrationDetail,
  CreateAccountOptions,
  UpdateAccountOptions,
  ListAccountsOptions,
  ConnectOptions,
} from "./types.js";
import { TTLCache } from "./cache.js";
import { convertTools, filterTools } from "./tool-converter.js";
import { parseSkillsMarkdown, buildSkillsSystemPrompt } from "./skill-parser.js";
import { createLoadSkillTool, createApiCallTool } from "../tools/skills.js";

const DEFAULT_BASE_URL = "https://app.supyagent.com";
const CACHE_KEY = "tools";

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

function createFetcher(baseUrl: string, apiKey: string, accountId?: string): Fetcher {
  return async function fetcher(path: string, init?: RequestInit) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(accountId ? { "X-Account-Id": accountId } : {}),
        ...((init?.headers as Record<string, string>) ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supyagent API error (${res.status}): ${text}`);
    }
    return res;
  };
}

function createDataPlane(
  fetcher: Fetcher,
  baseUrl: string,
  apiKey: string,
  accountId?: string,
) {
  const toolsCache = new TTLCache<ToolsResponse>();
  const skillsCache = new TTLCache<ParsedSkillsDocument>();
  const meCache = new TTLCache<MeResponse>();

  return {
    async tools(filterOptions?: ToolFilterOptions) {
      const cacheTTL = resolveCacheTTL(filterOptions?.cache);

      // Check cache
      let response = cacheTTL > 0 ? toolsCache.get(CACHE_KEY) : undefined;

      if (!response) {
        // Fetch from API
        const res = await fetcher("/api/v1/tools", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const json = await res.json();
        // API wraps response in { ok, data: { tools, base_url, total } }
        response = (json.data ?? json) as ToolsResponse;

        // Store in cache if TTL > 0
        if (cacheTTL > 0) {
          toolsCache.set(CACHE_KEY, response, cacheTTL);
        }
      }

      // Use API-reported base_url for tool execution
      const toolBaseUrl = response.base_url || baseUrl;

      // Guard against non-array tools (e.g., API returns empty or unexpected shape)
      const toolsArray = Array.isArray(response.tools) ? response.tools : [];

      // Filter
      const filtered = filterTools(toolsArray, {
        only: filterOptions?.only,
        except: filterOptions?.except,
      });

      // Convert to AI SDK tools
      return convertTools(filtered, toolBaseUrl, apiKey, accountId);
    },

    async skills(options?: SkillsOptions): Promise<SkillsResult> {
      const cacheTTL = resolveCacheTTL(options?.cache);

      let parsed = cacheTTL > 0 ? skillsCache.get("skills") : undefined;

      if (!parsed) {
        const res = await fetcher("/api/v1/skills");

        parsed = parseSkillsMarkdown(await res.text());

        if (cacheTTL > 0) {
          skillsCache.set("skills", parsed, cacheTTL);
        }
      }

      return {
        systemPrompt: buildSkillsSystemPrompt(parsed),
        tools: {
          loadSkill: createLoadSkillTool(parsed.skills),
          apiCall: createApiCallTool(baseUrl, apiKey, accountId),
        },
      };
    },

    async me(options?: MeOptions): Promise<MeResponse> {
      const cacheTTL = resolveCacheTTL(options?.cache);

      let response = cacheTTL > 0 ? meCache.get("me") : undefined;

      if (!response) {
        const res = await fetcher("/api/v1/me");

        const json = await res.json();
        response = (json.data ?? json) as MeResponse;

        if (cacheTTL > 0) {
          meCache.set("me", response, cacheTTL);
        }
      }

      return response;
    },
  };
}

/**
 * Create a supyagent client for fetching and converting tools.
 *
 * @example
 * ```ts
 * import { supyagent } from '@supyagent/sdk';
 *
 * const client = supyagent({ apiKey: process.env.SUPYAGENT_API_KEY! });
 * const tools = await client.tools({ cache: 300 });
 * ```
 */
export function supyagent(options: SupyagentOptions): SupyagentClient {
  const { apiKey, baseUrl = DEFAULT_BASE_URL } = options;

  const fetcher = createFetcher(baseUrl, apiKey);
  const dataPlane = createDataPlane(fetcher, baseUrl, apiKey);

  async function apiCall<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetcher(path, {
      method,
      ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    });

    const json = await res.json();
    return (json.data ?? json) as T;
  }

  return {
    ...dataPlane,
    accounts: createAccountsClient(apiCall),
    asAccount(externalId: string): ScopedClient {
      const scopedFetcher = createFetcher(baseUrl, apiKey, externalId);
      const scopedDataPlane = createDataPlane(scopedFetcher, baseUrl, apiKey, externalId);
      return {
        accountId: externalId,
        ...scopedDataPlane,
      };
    },
  };
}

function createAccountsClient(
  apiCall: <T>(method: string, path: string, body?: Record<string, unknown>) => Promise<T>,
): AccountsClient {
  function toAccount(raw: Record<string, unknown>): ConnectedAccount {
    return {
      id: raw.id as string,
      externalId: raw.external_id as string,
      displayName: (raw.display_name as string | null) ?? null,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      createdAt: raw.created_at as string,
    };
  }

  function toIntegration(raw: Record<string, unknown>): {
    id: string;
    provider: string;
    status: string;
    connectedAt: string;
  } {
    return {
      id: raw.id as string,
      provider: raw.provider as string,
      status: raw.status as string,
      connectedAt: raw.connected_at as string,
    };
  }

  function toIntegrationDetail(raw: Record<string, unknown>): AccountIntegrationDetail {
    const services = (raw.enabled_services as Array<Record<string, unknown>>) ?? [];
    return {
      ...toIntegration(raw),
      enabledServices: services.map((s) => ({
        serviceName: s.service_name as string,
        isEnabled: s.is_enabled as boolean,
      })),
    };
  }

  return {
    async create(opts: CreateAccountOptions): Promise<ConnectedAccount> {
      const raw = await apiCall<Record<string, unknown>>("POST", "/api/v1/accounts", {
        external_id: opts.externalId,
        ...(opts.displayName != null ? { display_name: opts.displayName } : {}),
        ...(opts.metadata != null ? { metadata: opts.metadata } : {}),
      });
      return toAccount(raw);
    },

    async list(opts?: ListAccountsOptions): Promise<ListAccountsResponse> {
      const params = new URLSearchParams();
      if (opts?.limit != null) params.set("limit", String(opts.limit));
      if (opts?.offset != null) params.set("offset", String(opts.offset));
      const qs = params.toString();
      const raw = await apiCall<Record<string, unknown>>(
        "GET",
        `/api/v1/accounts${qs ? `?${qs}` : ""}`,
      );
      return {
        accounts: ((raw.accounts as Array<Record<string, unknown>>) ?? []).map(toAccount),
        total: raw.total as number,
        limit: raw.limit as number,
        offset: raw.offset as number,
      };
    },

    async get(id: string): Promise<ConnectedAccountWithIntegrations> {
      const raw = await apiCall<Record<string, unknown>>("GET", `/api/v1/accounts/${id}`);
      return {
        ...toAccount(raw),
        integrations: ((raw.integrations as Array<Record<string, unknown>>) ?? []).map(
          toIntegration,
        ),
      };
    },

    async update(id: string, opts: UpdateAccountOptions): Promise<ConnectedAccount> {
      const body: Record<string, unknown> = {};
      if (opts.displayName !== undefined) body.display_name = opts.displayName;
      if (opts.metadata !== undefined) body.metadata = opts.metadata;
      const raw = await apiCall<Record<string, unknown>>("PATCH", `/api/v1/accounts/${id}`, body);
      return toAccount(raw);
    },

    async delete(id: string): Promise<{ deleted: true }> {
      return apiCall<{ deleted: true }>("DELETE", `/api/v1/accounts/${id}`);
    },

    async connect(id: string, opts: ConnectOptions): Promise<ConnectSession> {
      const raw = await apiCall<Record<string, unknown>>(
        "POST",
        `/api/v1/accounts/${id}/connect`,
        {
          provider: opts.provider,
          redirect_url: opts.redirectUrl,
          ...(opts.scopes ? { scopes: opts.scopes } : {}),
        },
      );
      return {
        connectUrl: raw.connect_url as string,
        sessionId: raw.session_id as string,
        expiresAt: raw.expires_at as string,
      };
    },

    async getSession(id: string, sessionId: string): Promise<ConnectSessionStatus> {
      const raw = await apiCall<Record<string, unknown>>(
        "GET",
        `/api/v1/accounts/${id}/connect/${sessionId}`,
      );
      return {
        sessionId: raw.session_id as string,
        provider: raw.provider as string,
        status: raw.status as string,
        ...(raw.error ? { error: raw.error as string } : {}),
        createdAt: raw.created_at as string,
        expiresAt: raw.expires_at as string,
      };
    },

    async integrations(id: string): Promise<AccountIntegrationDetail[]> {
      const raw = await apiCall<Record<string, unknown>>(
        "GET",
        `/api/v1/accounts/${id}/integrations`,
      );
      return ((raw.integrations as Array<Record<string, unknown>>) ?? []).map(
        toIntegrationDetail,
      );
    },

    async disconnect(id: string, provider: string): Promise<{ deleted: true; provider: string }> {
      return apiCall<{ deleted: true; provider: string }>(
        "DELETE",
        `/api/v1/accounts/${id}/integrations/${provider}`,
      );
    },
  };
}

function resolveCacheTTL(cache?: boolean | number): number {
  if (cache === true) return 60;
  if (typeof cache === "number") return cache;
  return 0;
}
