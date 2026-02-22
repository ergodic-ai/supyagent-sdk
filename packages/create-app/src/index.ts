import * as p from "@clack/prompts";
import pc from "picocolors";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { runPrompts } from "./prompts.js";
import { scaffoldProject } from "./scaffold.js";
import { installDeps } from "./post-install.js";
import { writeEnvLocal, runDbSetup, runDevServer } from "./quickstart.js";
import { loginViaBrowser } from "./device-auth.js";
import { AI_PROVIDERS, DB_CONFIGS, resolveProjectPath, projectExists } from "./utils.js";
import type { ProjectConfig, ApiKeys } from "./utils.js";

interface ParsedArgs extends Partial<ProjectConfig> {
  supyagentApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openrouterApiKey?: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {};
  let projectName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    const hasValue = next && !next.startsWith("-");

    if (arg === "--provider" && hasValue) {
      result.aiProvider = args[++i] as ProjectConfig["aiProvider"];
    } else if (arg === "--db" && hasValue) {
      result.database = args[++i] as ProjectConfig["database"];
    } else if (arg === "--mode" && hasValue) {
      result.agentMode = args[++i] as ProjectConfig["agentMode"];
    } else if (arg === "--model" && hasValue) {
      result.model = args[++i];
    } else if (arg === "--supyagent-api-key" && hasValue) {
      result.supyagentApiKey = args[++i];
    } else if (arg === "--anthropic-api-key" && hasValue) {
      result.anthropicApiKey = args[++i];
    } else if (arg === "--openai-api-key" && hasValue) {
      result.openaiApiKey = args[++i];
    } else if (arg === "--openrouter-api-key" && hasValue) {
      result.openrouterApiKey = args[++i];
    } else if (!arg.startsWith("-")) {
      projectName = arg;
    }
  }

  return {
    ...result,
    projectName,
    projectPath: projectName ? resolveProjectPath(projectName) : undefined,
  };
}

const ENV_KEY_MAP: Record<ProjectConfig["aiProvider"], string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const CLI_KEY_MAP: Record<ProjectConfig["aiProvider"], keyof ParsedArgs> = {
  anthropic: "anthropicApiKey",
  openai: "openaiApiKey",
  openrouter: "openrouterApiKey",
};

/**
 * Parse a `.env` file into a key-value map. Handles simple KEY=VALUE lines,
 * quoted values, and ignores comments/blank lines.
 */
function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!existsSync(filePath)) return result;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) result[key] = val;
  }
  return result;
}

/**
 * Walk up from cwd looking for .env files and merge them (closest wins).
 */
function loadEnvFiles(): Record<string, string> {
  const merged: Record<string, string> = {};
  const files: string[] = [];
  let dir = process.cwd();
  const root = dirname(dir) === dir ? dir : "/";
  // Collect .env files walking up (stop after 5 levels or root)
  for (let i = 0; i < 5 && dir !== root; i++) {
    const envPath = resolve(dir, ".env");
    if (existsSync(envPath)) files.push(envPath);
    dir = dirname(dir);
  }
  // Merge in reverse order so closest .env wins
  for (const f of files.reverse()) {
    Object.assign(merged, parseEnvFile(f));
  }
  return merged;
}

async function promptForKey(name: string): Promise<string> {
  const value = await p.password({ message: `Enter your ${name}` });
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }
  return value;
}

async function resolveSupyagentKey(parsed: ParsedArgs): Promise<string> {
  // 1. Check CLI flag, env, and .env files first
  const dotenvVars = loadEnvFiles();
  const existing =
    parsed.supyagentApiKey ??
    process.env.SUPYAGENT_API_KEY ??
    dotenvVars.SUPYAGENT_API_KEY;

  if (existing) {
    if (!parsed.supyagentApiKey) {
      p.log.info(`Using ${pc.cyan("SUPYAGENT_API_KEY")} from ${process.env.SUPYAGENT_API_KEY ? "environment" : ".env file"}`);
    }
    return existing;
  }

  // 2. Ask user how they want to authenticate
  const method = await p.select({
    message: "How would you like to authenticate with Supyagent?",
    options: [
      {
        value: "browser",
        label: "Login via browser",
        hint: "recommended — opens app.supyagent.com",
      },
      {
        value: "manual",
        label: "Paste API key",
        hint: "enter an existing key manually",
      },
    ],
  });

  if (p.isCancel(method)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }

  if (method === "browser") {
    const key = await loginViaBrowser();
    if (key) return key;
    // Browser flow failed — fall back to manual entry
    p.log.warn("Browser login failed. Please enter your API key manually.");
  }

  return promptForKey("SUPYAGENT_API_KEY");
}

async function resolveApiKeys(
  provider: ProjectConfig["aiProvider"],
  parsed: ParsedArgs,
): Promise<ApiKeys> {
  const envKey = ENV_KEY_MAP[provider];
  const cliFlag = CLI_KEY_MAP[provider];
  const dotenvVars = loadEnvFiles();

  const supyagent = await resolveSupyagentKey(parsed);

  const providerKey =
    (parsed[cliFlag] as string | undefined) ??
    process.env[envKey] ??
    dotenvVars[envKey] ??
    (await promptForKey(envKey));

  if (!(parsed[cliFlag] as string | undefined) && (process.env[envKey] || dotenvVars[envKey])) {
    p.log.info(`Using ${pc.cyan(envKey)} from ${process.env[envKey] ? "environment" : ".env file"}`);
  }

  return { supyagent, provider: providerKey };
}

async function main() {
  const parsed = parseArgs();

  // Collect project config — prompts or CLI flags
  let config: ProjectConfig | null;

  if (parsed.projectName && parsed.aiProvider && parsed.database) {
    // All required args provided — skip interactive prompts
    const projectPath = resolveProjectPath(parsed.projectName);
    if (projectExists(projectPath)) {
      p.cancel(`Directory "${parsed.projectName}" already exists.`);
      process.exit(1);
    }
    config = {
      projectName: parsed.projectName,
      projectPath,
      aiProvider: parsed.aiProvider,
      agentMode: parsed.agentMode ?? "skills",
      database: parsed.database,
      model: parsed.model,
    };
  } else {
    config = await runPrompts(parsed.projectName, {
      aiProvider: parsed.aiProvider,
      agentMode: parsed.agentMode,
      database: parsed.database,
    });
    if (config && parsed.model) {
      config.model = parsed.model;
    }
  }

  if (!config) {
    process.exit(1);
  }

  p.intro(pc.bgCyan(pc.black(" Create Supyagent App ")));

  // If PostgreSQL, prompt for DATABASE_URL
  if (config.database === "postgres") {
    const dbUrl = await p.text({
      message: "PostgreSQL connection URL",
      placeholder: DB_CONFIGS.postgres.url,
      validate(value) {
        if (!value) return "Connection URL is required";
      },
    });
    if (p.isCancel(dbUrl)) {
      p.cancel("Cancelled.");
      process.exit(1);
    }
    config.databaseUrl = dbUrl as string;
  } else {
    config.databaseUrl = DB_CONFIGS.sqlite.url;
  }

  // Resolve API keys
  const apiKeys = await resolveApiKeys(config.aiProvider, parsed);
  config.apiKeys = apiKeys;

  const s = p.spinner();

  // Scaffold
  s.start("Scaffolding project...");
  scaffoldProject(config);
  writeEnvLocal(config);
  s.stop("Scaffolded project");

  // Install deps
  s.start("Installing dependencies...");
  try {
    await installDeps(config.projectPath);
    s.stop("Installed dependencies");
  } catch {
    s.stop("Failed to install dependencies — run install manually");
    process.exit(1);
  }

  // Database setup
  s.start("Setting up database...");
  try {
    await runDbSetup(config.projectPath, config.databaseUrl);
    s.stop("Database ready");
  } catch {
    s.stop("Database setup failed");
    p.log.warn(
      `Run ${pc.cyan(`cd ${config.projectName} && pnpm db:setup`)} manually`,
    );
  }

  // Dev server
  p.log.info(pc.green("Starting dev server..."));
  await runDevServer(config.projectPath);
}

main().catch(console.error);
