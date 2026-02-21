import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function resolveProjectPath(name: string): string {
  return resolve(process.cwd(), name);
}

export function projectExists(path: string): boolean {
  return existsSync(path);
}

export interface ApiKeys {
  supyagent?: string;
  provider?: string;
}

export interface ProjectConfig {
  projectName: string;
  projectPath: string;
  aiProvider: "anthropic" | "openai" | "openrouter";
  database: "sqlite" | "postgres";
  agentMode: "skills" | "tools";
  model?: string;
  quickstart?: boolean;
  apiKeys?: ApiKeys;
}

export const AI_PROVIDERS = {
  anthropic: {
    label: "Anthropic (Claude)",
    package: "@ai-sdk/anthropic",
    packageVersion: "^3.0.0",
    import: `import { anthropic } from '@ai-sdk/anthropic'`,
    model: `anthropic('claude-sonnet-4-6-20250620')`,
    envKey: "ANTHROPIC_API_KEY",
  },
  openai: {
    label: "OpenAI (GPT)",
    package: "@ai-sdk/openai",
    packageVersion: "^3.0.0",
    import: `import { openai } from '@ai-sdk/openai'`,
    model: `openai('gpt-4o')`,
    envKey: "OPENAI_API_KEY",
  },
  openrouter: {
    label: "OpenRouter (any model)",
    package: "@openrouter/ai-sdk-provider",
    packageVersion: "^2.2.3",
    import: `import { createOpenRouter } from '@openrouter/ai-sdk-provider'`,
    model: `createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })('anthropic/claude-sonnet-4.6')`,
    envKey: "OPENROUTER_API_KEY",
  },
} as const;

export const DB_CONFIGS = {
  sqlite: {
    label: "SQLite (local dev)",
    provider: "sqlite",
    url: "file:./dev.db",
  },
  postgres: {
    label: "PostgreSQL (production)",
    provider: "postgresql",
    url: "postgresql://user:password@localhost:5432/mydb",
  },
} as const;

export function buildModelExpression(
  provider: ProjectConfig["aiProvider"],
  customModelId?: string,
): string {
  const config = AI_PROVIDERS[provider];
  if (!customModelId) return config.model;
  switch (provider) {
    case "anthropic":
      return `anthropic('${customModelId}')`;
    case "openai":
      return `openai('${customModelId}')`;
    case "openrouter":
      return `createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })('${customModelId}')`;
  }
}
