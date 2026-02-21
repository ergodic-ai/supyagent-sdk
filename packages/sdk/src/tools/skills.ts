import { tool, jsonSchema } from "ai";
import type { ParsedSkill } from "../core/types.js";
import { findSkill } from "../core/skill-parser.js";

/**
 * Create the loadSkill tool.
 * Returns detailed documentation for a specific skill.
 */
export function createLoadSkillTool(skills: ParsedSkill[]) {
  const availableNames = skills.map((s) => s.name).join(", ");

  return tool({
    description: `Load detailed API documentation for a specific skill. Available skills: ${availableNames}. Call this before using apiCall to understand the available endpoints, parameters, and examples.`,
    inputSchema: jsonSchema({
      type: "object",
      properties: {
        name: {
          type: "string",
          description: `The skill name to load. Available: ${availableNames}`,
        },
      },
      required: ["name"],
    } as Parameters<typeof jsonSchema>[0]),
    execute: async (args) => {
      const { name } = args as { name: string };
      const skill = findSkill(skills, name);

      if (!skill) {
        return {
          error: `Skill "${name}" not found. Available skills: ${availableNames}`,
        };
      }

      return {
        name: skill.name,
        documentation: skill.content,
      };
    },
  });
}

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

/**
 * Create the apiCall tool.
 * Makes authenticated HTTP requests to the Supyagent API.
 */
export function createApiCallTool(baseUrl: string, apiKey: string) {
  return tool({
    description:
      "Make an authenticated HTTP request to the Supyagent API. Use loadSkill first to understand available endpoints. The authorization header and base URL are handled automatically — only provide the path (e.g., /api/v1/google/gmail/messages).",
    inputSchema: jsonSchema({
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          description: "HTTP method",
        },
        path: {
          type: "string",
          description:
            'API path starting with /api/v1/ (e.g., "/api/v1/google/gmail/messages")',
        },
        body: {
          type: "object",
          description: "Request body for POST/PUT/PATCH requests",
          additionalProperties: true,
        },
        params: {
          type: "object",
          description: "Query parameters",
          additionalProperties: true,
        },
      },
      required: ["method", "path"],
    } as Parameters<typeof jsonSchema>[0]),
    execute: async (args) => {
      const {
        method: rawMethod,
        path,
        body,
        params,
      } = args as {
        method: string;
        path: string;
        body?: Record<string, unknown>;
        params?: Record<string, unknown>;
      };

      const method = rawMethod.toUpperCase();

      if (!VALID_METHODS.has(method)) {
        return { error: `Invalid HTTP method: ${method}` };
      }

      if (!path.startsWith("/api/v1/")) {
        return { error: `Path must start with /api/v1/. Got: ${path}` };
      }

      let url = `${baseUrl}${path}`;

      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        }
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
      }

      const fetchOptions: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      };

      if (body && method !== "GET" && method !== "DELETE") {
        fetchOptions.body = JSON.stringify(body);
      }

      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
          return { error: `API returned ${response.status}`, details: data };
        }

        return data;
      } catch (err) {
        return {
          error: `Request failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  });
}
