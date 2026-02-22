import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyTemplate } from "./template.js";
import { AI_PROVIDERS, DB_CONFIGS, buildModelExpression, type ProjectConfig } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");

function readTemplate(relativePath: string): string {
  return readFileSync(join(TEMPLATES_DIR, relativePath), "utf-8");
}

function writeProject(projectPath: string, relativePath: string, content: string): void {
  const fullPath = join(projectPath, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
}

function copyBinary(projectPath: string, relativePath: string, templateRelativePath: string): void {
  const src = join(TEMPLATES_DIR, templateRelativePath);
  const dest = join(projectPath, relativePath);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

export function scaffoldProject(config: ProjectConfig): void {
  const { projectPath, projectName, aiProvider, database } = config;
  const ai = AI_PROVIDERS[aiProvider];
  const db = DB_CONFIGS[database];

  const vars: Record<string, string> = {
    projectName,
    aiProviderPackage: ai.package,
    aiProviderVersion: ai.packageVersion,
    aiProviderImport: ai.import,
    aiModel: buildModelExpression(aiProvider, config.model),
    aiProviderEnvKey: ai.envKey,
    dbProvider: db.provider,
    dbUrl: db.url,
  };

  mkdirSync(projectPath, { recursive: true });

  // ── Base files ──
  writeProject(projectPath, "next.config.ts", readTemplate("base/next.config.ts"));
  writeProject(projectPath, "tsconfig.json", readTemplate("base/tsconfig.json"));
  writeProject(projectPath, "tailwind.config.ts", readTemplate("base/tailwind.config.ts"));
  writeProject(projectPath, "postcss.config.js", readTemplate("base/postcss.config.js"));
  writeProject(projectPath, ".gitignore", readTemplate("base/gitignore"));
  writeProject(projectPath, ".npmrc", readTemplate("base/npmrc"));
  writeProject(projectPath, "README.md", applyTemplate(readTemplate("base/README.md.tmpl"), vars));

  // ── Source files ──
  writeProject(projectPath, "src/app/layout.tsx", readTemplate("base/src/app/layout.tsx"));
  writeProject(projectPath, "src/app/page.tsx", readTemplate("base/src/app/page.tsx"));
  writeProject(projectPath, "src/app/globals.css", readTemplate("base/src/app/globals.css"));
  writeProject(projectPath, "src/app/chat/page.tsx", readTemplate("base/src/app/chat/page.tsx"));
  writeProject(projectPath, "src/app/chat/[id]/page.tsx", readTemplate("base/src/app/chat/[id]/page.tsx"));

  // API routes — use skills or tools template based on agentMode
  const routeTemplate = config.agentMode === "skills"
    ? "api-route/route.skills.ts.tmpl"
    : "api-route/route.tools.ts.tmpl";
  writeProject(
    projectPath,
    "src/app/api/chat/route.ts",
    applyTemplate(readTemplate(routeTemplate), vars)
  );
  writeProject(
    projectPath,
    "src/app/api/chat/compact/route.ts",
    applyTemplate(readTemplate("api-route/compact/route.ts.tmpl"), vars)
  );
  writeProject(projectPath, "src/app/api/chats/route.ts", readTemplate("base/src/app/api/chats/route.ts"));
  writeProject(projectPath, "src/app/api/chats/[id]/route.ts", readTemplate("base/src/app/api/chats/[id]/route.ts"));
  writeProject(projectPath, "src/app/api/jobs/[id]/route.ts", readTemplate("base/src/app/api/jobs/[id]/route.ts"));
  writeProject(projectPath, "src/app/api/me/route.ts", readTemplate("base/src/app/api/me/route.ts"));

  // Hooks
  writeProject(projectPath, "src/hooks/use-job-polling.ts", readTemplate("base/src/hooks/use-job-polling.ts"));

  // Components
  writeProject(projectPath, "src/components/chat.tsx", readTemplate("base/src/components/chat.tsx"));
  writeProject(projectPath, "src/components/chat-sidebar.tsx", readTemplate("base/src/components/chat-sidebar.tsx"));
  writeProject(projectPath, "src/components/chat-message.tsx", readTemplate("base/src/components/chat-message.tsx"));
  writeProject(projectPath, "src/components/chat-input.tsx", readTemplate("base/src/components/chat-input.tsx"));
  writeProject(projectPath, "src/components/header.tsx", readTemplate("base/src/components/header.tsx"));
  writeProject(projectPath, "src/components/user-button.tsx", readTemplate("base/src/components/user-button.tsx"));
  writeProject(projectPath, "src/components/theme-provider.tsx", readTemplate("base/src/components/theme-provider.tsx"));
  writeProject(projectPath, "src/components/slash-menu.tsx", readTemplate("base/src/components/slash-menu.tsx"));

  // UI primitives (shadcn-style)
  writeProject(projectPath, "src/components/ui/badge.tsx", readTemplate("base/src/components/ui/badge.tsx"));
  writeProject(projectPath, "src/components/ui/collapsible.tsx", readTemplate("base/src/components/ui/collapsible.tsx"));

  // AI Elements (pre-bundled Tool component)
  writeProject(projectPath, "src/components/ai-elements/tool.tsx", readTemplate("base/src/components/ai-elements/tool.tsx"));

  // Supyagent tool rendering (local, editable)
  writeProject(projectPath, "src/components/supyagent/tool-message.tsx", readTemplate("base/src/components/supyagent/tool-message.tsx"));
  writeProject(projectPath, "src/components/supyagent/tool-renderers.tsx", readTemplate("base/src/components/supyagent/tool-renderers.tsx"));

  // Tool renderers — one per integration
  const toolRenderers = [
    "gmail", "calendar", "slack", "github", "drive", "search", "docs",
    "sheets", "slides", "hubspot", "linear", "pipedrive", "compute",
    "resend", "inbox", "discord", "notion", "twitter", "telegram",
    "stripe", "jira", "salesforce", "brevo", "calendly", "twilio",
    "linkedin", "bash", "image", "audio", "video", "whatsapp",
    "browser", "view-image", "jobs", "generic",
  ];
  for (const tool of toolRenderers) {
    writeProject(projectPath, `src/components/supyagent/tools/${tool}.tsx`, readTemplate(`base/src/components/supyagent/tools/${tool}.tsx`));
  }

  // Lib
  writeProject(projectPath, "src/lib/utils.ts", readTemplate("base/src/lib/utils.ts"));
  writeProject(projectPath, "src/lib/prisma.ts", readTemplate("base/src/lib/prisma.ts"));

  // ── Branding assets ──
  copyBinary(projectPath, "public/logo.png", "base/public/logo.png");
  copyBinary(projectPath, "src/app/icon.png", "base/public/logo.png");

  // ── Prisma schema ──
  writeProject(
    projectPath,
    "prisma/schema.prisma",
    applyTemplate(readTemplate("prisma/schema.prisma.tmpl"), vars)
  );

  // ── Env example ──
  writeProject(
    projectPath,
    ".env.example",
    applyTemplate(readTemplate("env/.env.example.tmpl"), vars)
  );

  // ── package.json ──
  writeProject(
    projectPath,
    "package.json",
    applyTemplate(readTemplate("package-json/package.json.tmpl"), vars)
  );
}
