import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function resolveProjectPath(name: string): string {
  return resolve(process.cwd(), name);
}

export function projectExists(path: string): boolean {
  return existsSync(path);
}

export interface ProjectConfig {
  projectName: string;
  projectPath: string;
  aiProvider: "anthropic" | "openai" | "openrouter";
  database: "sqlite" | "postgres";
}

export const AI_PROVIDERS = {
  anthropic: {
    label: "Anthropic (Claude)",
    package: "@ai-sdk/anthropic",
    import: `import { anthropic } from '@ai-sdk/anthropic'`,
    model: `anthropic('claude-sonnet-4-20250514')`,
    envKey: "ANTHROPIC_API_KEY",
  },
  openai: {
    label: "OpenAI (GPT)",
    package: "@ai-sdk/openai",
    import: `import { openai } from '@ai-sdk/openai'`,
    model: `openai('gpt-4o')`,
    envKey: "OPENAI_API_KEY",
  },
  openrouter: {
    label: "OpenRouter (any model)",
    package: "@ai-sdk/openrouter",
    import: `import { openrouter } from '@ai-sdk/openrouter'`,
    model: `openrouter('anthropic/claude-sonnet-4-20250514')`,
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
