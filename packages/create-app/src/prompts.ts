import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ProjectConfig } from "./utils.js";
import { AI_PROVIDERS, DB_CONFIGS, resolveProjectPath, projectExists } from "./utils.js";

export async function runPrompts(argName?: string): Promise<ProjectConfig | null> {
  p.intro(pc.bgCyan(pc.black(" Create Supyagent App ")));

  const projectName = argName || await p.text({
    message: "Project name",
    placeholder: "my-supyagent-app",
    defaultValue: "my-supyagent-app",
    validate(value) {
      if (!value) return "Project name is required";
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
        return "Invalid project name (lowercase, alphanumeric, hyphens, dots)";
      }
    },
  }) as string;

  if (p.isCancel(projectName)) {
    p.cancel("Cancelled.");
    return null;
  }

  const projectPath = resolveProjectPath(projectName);

  if (projectExists(projectPath)) {
    p.cancel(`Directory "${projectName}" already exists.`);
    return null;
  }

  const aiProvider = await p.select({
    message: "AI provider",
    options: [
      { value: "anthropic", label: AI_PROVIDERS.anthropic.label },
      { value: "openai", label: AI_PROVIDERS.openai.label },
      { value: "openrouter", label: AI_PROVIDERS.openrouter.label },
    ],
  }) as "anthropic" | "openai" | "openrouter";

  if (p.isCancel(aiProvider)) {
    p.cancel("Cancelled.");
    return null;
  }

  const database = await p.select({
    message: "Database",
    options: [
      { value: "sqlite", label: DB_CONFIGS.sqlite.label },
      { value: "postgres", label: DB_CONFIGS.postgres.label },
    ],
  }) as "sqlite" | "postgres";

  if (p.isCancel(database)) {
    p.cancel("Cancelled.");
    return null;
  }

  return { projectName, projectPath, aiProvider, database };
}
