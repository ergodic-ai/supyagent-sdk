import * as p from "@clack/prompts";
import pc from "picocolors";
import { runPrompts } from "./prompts.js";
import { scaffoldProject } from "./scaffold.js";
import { installDeps } from "./post-install.js";
import { resolveProjectPath } from "./utils.js";
import type { ProjectConfig } from "./utils.js";

function parseArgs(): Partial<ProjectConfig> & { skipInstall?: boolean } {
  const args = process.argv.slice(2);
  const result: Record<string, string | boolean> = {};
  let projectName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--provider" && args[i + 1]) {
      result.aiProvider = args[++i];
    } else if (arg === "--db" && args[i + 1]) {
      result.database = args[++i];
    } else if (arg === "--skip-install") {
      result.skipInstall = true;
    } else if (!arg.startsWith("-")) {
      projectName = arg;
    }
  }

  return {
    projectName,
    projectPath: projectName ? resolveProjectPath(projectName) : undefined,
    aiProvider: result.aiProvider as ProjectConfig["aiProvider"],
    database: result.database as ProjectConfig["database"],
    skipInstall: result.skipInstall as boolean | undefined,
  };
}

async function main() {
  const parsed = parseArgs();

  // If all required args are provided, skip interactive prompts
  const isNonInteractive =
    parsed.projectName && parsed.aiProvider && parsed.database;

  let config: ProjectConfig | null;

  if (isNonInteractive) {
    config = {
      projectName: parsed.projectName!,
      projectPath: parsed.projectPath!,
      aiProvider: parsed.aiProvider!,
      database: parsed.database!,
    };
    console.log(`Creating ${config.projectName}...`);
  } else {
    config = await runPrompts(parsed.projectName);
  }

  if (!config) {
    process.exit(1);
  }

  if (isNonInteractive) {
    scaffoldProject(config);
    console.log("Scaffolded project");

    if (!parsed.skipInstall) {
      console.log("Installing dependencies...");
      try {
        await installDeps(config.projectPath);
        console.log("Installed dependencies");
      } catch {
        console.log("Failed to install dependencies — run install manually");
      }
    }

    console.log(`\nNext steps:\n  cd ${config.projectName}\n  cp .env.example .env.local\n  pnpm db:setup\n  pnpm dev`);
  } else {
    const s = p.spinner();

    s.start("Scaffolding project...");
    scaffoldProject(config);
    s.stop("Scaffolded project");

    s.start("Installing dependencies...");
    try {
      await installDeps(config.projectPath);
      s.stop("Installed dependencies");
    } catch {
      s.stop("Failed to install dependencies — run install manually");
    }

    p.note(
      [
        `cd ${config.projectName}`,
        `cp .env.example .env.local    ${pc.dim("# Add your API keys")}`,
        `pnpm db:setup                 ${pc.dim("# Initialize database")}`,
        `pnpm dev                      ${pc.dim("# Start development server")}`,
      ].join("\n"),
      "Next steps"
    );

    p.outro(pc.green("Done!"));
  }
}

main().catch(console.error);
