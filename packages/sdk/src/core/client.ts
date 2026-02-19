import type {
  SupyagentOptions,
  SupyagentClient,
  ToolFilterOptions,
  ToolsResponse,
} from "./types.js";
import { TTLCache } from "./cache.js";
import { convertTools, filterTools } from "./tool-converter.js";

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

        response = (await res.json()) as ToolsResponse;

        // Store in cache if TTL > 0
        if (cacheTTL > 0) {
          cache.set(CACHE_KEY, response, cacheTTL);
        }
      }

      // Use API-reported base_url for tool execution
      const toolBaseUrl = response.base_url || baseUrl;

      // Filter
      const filtered = filterTools(response.tools, {
        only: filterOptions?.only,
        except: filterOptions?.except,
      });

      // Convert to AI SDK tools
      return convertTools(filtered, toolBaseUrl, apiKey);
    },
  };
}

function resolveCacheTTL(cache?: boolean | number): number {
  if (cache === true) return 60;
  if (typeof cache === "number") return cache;
  return 0;
}
