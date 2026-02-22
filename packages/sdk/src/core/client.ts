import type {
  SupyagentOptions,
  SupyagentClient,
  ToolFilterOptions,
  ToolsResponse,
  SkillsOptions,
  SkillsResult,
  ParsedSkillsDocument,
  MeOptions,
  MeResponse,
} from "./types.js";
import { TTLCache } from "./cache.js";
import { convertTools, filterTools } from "./tool-converter.js";
import { parseSkillsMarkdown, buildSkillsSystemPrompt } from "./skill-parser.js";
import { createLoadSkillTool, createApiCallTool } from "../tools/skills.js";

const DEFAULT_BASE_URL = "https://app.supyagent.com";
const CACHE_KEY = "tools";

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
  const cache = new TTLCache<ToolsResponse>();
  const skillsCache = new TTLCache<ParsedSkillsDocument>();
  const meCache = new TTLCache<MeResponse>();

  return {
    async tools(filterOptions?: ToolFilterOptions) {
      const cacheTTL = resolveCacheTTL(filterOptions?.cache);

      // Check cache
      let response = cacheTTL > 0 ? cache.get(CACHE_KEY) : undefined;

      if (!response) {
        // Fetch from API
        const res = await fetch(`${baseUrl}/api/v1/tools`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(
            `Supyagent API error (${res.status}): ${error}`
          );
        }

        const json = await res.json();
        // API wraps response in { ok, data: { tools, base_url, total } }
        response = (json.data ?? json) as ToolsResponse;

        // Store in cache if TTL > 0
        if (cacheTTL > 0) {
          cache.set(CACHE_KEY, response, cacheTTL);
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
      return convertTools(filtered, toolBaseUrl, apiKey);
    },

    async skills(options?: SkillsOptions): Promise<SkillsResult> {
      const cacheTTL = resolveCacheTTL(options?.cache);

      let parsed = cacheTTL > 0 ? skillsCache.get("skills") : undefined;

      if (!parsed) {
        const res = await fetch(`${baseUrl}/api/v1/skills`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(
            `Supyagent API error (${res.status}): ${error}`
          );
        }

        parsed = parseSkillsMarkdown(await res.text());

        if (cacheTTL > 0) {
          skillsCache.set("skills", parsed, cacheTTL);
        }
      }

      return {
        systemPrompt: buildSkillsSystemPrompt(parsed),
        tools: {
          loadSkill: createLoadSkillTool(parsed.skills),
          apiCall: createApiCallTool(baseUrl, apiKey),
        },
      };
    },

    async me(options?: MeOptions): Promise<MeResponse> {
      const cacheTTL = resolveCacheTTL(options?.cache);

      let response = cacheTTL > 0 ? meCache.get("me") : undefined;

      if (!response) {
        const res = await fetch(`${baseUrl}/api/v1/me`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(
            `Supyagent API error (${res.status}): ${error}`
          );
        }

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

function resolveCacheTTL(cache?: boolean | number): number {
  if (cache === true) return 60;
  if (typeof cache === "number") return cache;
  return 0;
}
