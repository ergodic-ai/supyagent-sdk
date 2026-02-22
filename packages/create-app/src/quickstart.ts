import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync, spawn as nodeSpawn } from "node:child_process";
import { detectPackageManager } from "nypm";
import { AI_PROVIDERS, DB_CONFIGS, type ProjectConfig } from "./utils.js";

export function writeEnvLocal(config: ProjectConfig): void {
  const { projectPath, aiProvider, apiKeys, database, databaseUrl } = config;
  const ai = AI_PROVIDERS[aiProvider];
  const dbUrl = databaseUrl ?? DB_CONFIGS[database].url;

  const lines = [
    "# Supyagent — Get your API key at https://app.supyagent.com",
    `SUPYAGENT_API_KEY=${apiKeys?.supyagent ?? ""}`,
    "",
    "# AI Provider",
    `${ai.envKey}=${apiKeys?.provider ?? ""}`,
    "",
    "# Database",
    `DATABASE_URL="${dbUrl}"`,
    "",
  ];

  writeFileSync(join(projectPath, ".env.local"), lines.join("\n"), "utf-8");
}

export async function runDbSetup(projectPath: string, databaseUrl?: string): Promise<void> {
  const pm = await detectPackageManager(projectPath);
  const cmd = pm?.name ?? "pnpm";
  execSync(`${cmd} run db:setup`, {
    cwd: projectPath,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl ?? "file:./dev.db" },
  });
}

export async function runDevServer(projectPath: string): Promise<never> {
  const pm = await detectPackageManager(projectPath);
  const cmd = pm?.name ?? "pnpm";

  const child = nodeSpawn(cmd, ["run", "dev"], {
    cwd: projectPath,
    stdio: "inherit",
  });

  const forward = (signal: NodeJS.Signals) => {
    child.kill(signal);
  };

  process.on("SIGINT", forward);
  process.on("SIGTERM", forward);

  return new Promise((_, reject) => {
    child.on("close", (code) => {
      process.off("SIGINT", forward);
      process.off("SIGTERM", forward);
      process.exit(code ?? 0);
    });
    child.on("error", reject);
  });
}
