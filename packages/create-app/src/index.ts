import * as p from "@clack/prompts";
import pc from "picocolors";
import { runPrompts } from "./prompts.js";
import { scaffoldProject } from "./scaffold.js";
import { installDeps } from "./post-install.js";

async function main() {
  const argName = process.argv[2];
  const config = await runPrompts(argName);

  if (!config) {
    process.exit(1);
  }

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

main().catch(console.error);
