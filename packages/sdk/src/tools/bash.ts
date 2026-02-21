import { tool, jsonSchema } from "ai";
import { exec, type ExecException } from "node:child_process";

const MAX_OUTPUT = 30_000;
const DEFAULT_TIMEOUT = 30_000; // 30 seconds

// ── Environment sanitization ────────────────────────────────────────────────

const SECRET_PATTERNS = [
  /key/i, /secret/i, /token/i, /password/i, /credential/i,
  /auth/i, /private/i, /api_key/i, /apikey/i,
  /^AWS_/i, /^AZURE_/i, /^GCP_/i, /^GITHUB_/i,
  /^DATABASE_URL$/i, /^ENCRYPTION_/i, /^SUPABASE_/i,
];

const SAFE_VARS = new Set([
  "PATH", "HOME", "USER", "SHELL", "LANG", "LC_ALL", "LC_CTYPE",
  "TERM", "EDITOR", "VISUAL", "TMPDIR", "TMP", "TEMP",
  "NODE_ENV", "NODE_PATH", "NODE_OPTIONS",
  "NPM_CONFIG_PREFIX", "NVM_DIR", "NVM_BIN", "NVM_INC",
  "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME",
  "COLORTERM", "FORCE_COLOR", "NO_COLOR",
  "COLUMNS", "LINES", "SHLVL", "PWD", "OLDPWD", "LOGNAME",
  "HOSTNAME", "HOSTTYPE", "OSTYPE", "MACHTYPE",
]);

function sanitizeEnv(
  env: NodeJS.ProcessEnv,
  opts?: { include?: string[]; exclude?: string[] }
): Record<string, string> {
  const result: Record<string, string> = {};
  const includeSet = opts?.include ? new Set(opts.include) : null;
  const excludeSet = opts?.exclude ? new Set(opts.exclude) : null;

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;
    if (excludeSet?.has(key)) continue;
    if (includeSet?.has(key)) { result[key] = value; continue; }
    if (SAFE_VARS.has(key)) { result[key] = value; continue; }
    if (SECRET_PATTERNS.some(p => p.test(key))) continue;
    result[key] = value;
  }

  result.TERM = "dumb";
  return result;
}

function buildEnv(
  policy: BashToolOptions["env"],
  opts?: BashToolOptions
): Record<string, string> {
  if (typeof policy === "object" && policy !== null) {
    return { ...policy, TERM: "dumb" };
  }
  switch (policy) {
    case "inherit":
      return { ...process.env, TERM: "dumb" } as Record<string, string>;
    case "none":
      return {
        PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
        HOME: process.env.HOME ?? "/tmp",
        TERM: "dumb",
      };
    case "safe":
    default:
      return sanitizeEnv(process.env, {
        include: opts?.envInclude,
        exclude: opts?.envExclude,
      });
  }
}

// ── Command safety ──────────────────────────────────────────────────────────

type CommandSafety = "safe" | "dangerous" | "unknown";

const SAFE_COMMANDS = new Set([
  "cat", "cd", "cut", "echo", "expr", "false", "grep", "egrep", "fgrep",
  "head", "id", "ls", "nl", "paste", "pwd", "rev", "seq", "stat",
  "tail", "tr", "true", "uname", "uniq", "wc", "which", "whoami",
  "date", "env", "printenv", "hostname", "df", "du", "file",
  "find", "rg", "tree", "less", "more", "sort",
  "diff", "md5sum", "sha256sum", "base64", "xxd", "hexdump",
  "man", "help", "type", "command", "test", "basename", "dirname",
  "realpath", "readlink", "tee", "xargs", "jq", "yq",
]);

const SAFE_GIT_SUBCOMMANDS = new Set([
  "status", "log", "diff", "show", "branch", "tag", "remote",
  "stash", "describe", "shortlog", "blame", "reflog", "rev-parse",
  "ls-files", "ls-tree", "cat-file", "rev-list", "name-rev",
]);

const DANGEROUS_PATTERNS = [
  /rm\s+(-[^\s]*f|-[^\s]*r|--force|--recursive).*\//,
  /:\(\)\s*\{\s*:\|:&\s*\};:/,
  />\s*\/dev\/sd/,
  /mkfs\./,
  /dd\s+.*of=\/dev\//,
  /shutdown|reboot|halt|poweroff/,
  /chmod\s+777\s+\//,
  /curl.*\|\s*(ba)?sh/,
  /wget.*\|\s*(ba)?sh/,
];

function classifyCommand(
  command: string,
  extraSafe?: Set<string>,
  extraDeny?: RegExp[],
): CommandSafety {
  const trimmed = command.trim();

  // Check dangerous patterns first
  if (DANGEROUS_PATTERNS.some(p => p.test(trimmed))) return "dangerous";
  if (extraDeny?.some(p => p.test(trimmed))) return "dangerous";

  // Extract base command (strip leading env var assignments)
  const stripped = trimmed.replace(/^(\w+=\S+\s+)*/, "");
  const parts = stripped.split(/\s+/);
  const base = parts[0]?.replace(/^.*\//, ""); // strip path prefix

  if (!base) return "unknown";

  // Check git subcommands
  if (base === "git") {
    const sub = parts[1];
    if (sub && SAFE_GIT_SUBCOMMANDS.has(sub)) return "safe";
    return "unknown";
  }

  if (SAFE_COMMANDS.has(base)) return "safe";
  if (extraSafe?.has(base)) return "safe";

  return "unknown";
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface BashToolOptions {
  /** Working directory for commands. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Command timeout in milliseconds. Defaults to 30000 (30s). Max 600000 (10m). */
  timeout?: number;
  /** Maximum output length in characters. Defaults to 30000. */
  maxOutput?: number;

  /**
   * Command approval policy. Default: "auto".
   * - `"auto"`: Safe read-only commands (ls, cat, grep...) auto-execute; others require user approval
   * - `"always"`: Every command requires user approval before execution
   * - `"never"`: No approval required (use only in trusted environments)
   * - `function`: Custom approval logic — return `true` to require approval
   */
  approval?: "auto" | "always" | "never" | ((command: string) => boolean | Promise<boolean>);

  /**
   * Environment variable policy. Default: "safe".
   * - `"safe"`: Strip vars matching secret patterns (KEY, TOKEN, SECRET, PASSWORD, etc.)
   * - `"inherit"`: Pass full process.env (NOT recommended for production)
   * - `"none"`: Minimal env (PATH, HOME, TERM only)
   * - `Record<string,string>`: Explicit env vars to use
   */
  env?: "safe" | "inherit" | "none" | Record<string, string>;

  /** Extra env vars to include even if they match secret patterns. Only used with `env: "safe"`. */
  envInclude?: string[];
  /** Extra env vars to exclude beyond default secret patterns. Only used with `env: "safe"`. */
  envExclude?: string[];

  /** Additional commands to treat as safe (auto-execute without approval in "auto" mode). */
  allowCommands?: string[];
  /** Additional patterns to block (never execute, even if approved). */
  denyPatterns?: RegExp[];
}

export interface BashToolResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut?: boolean;
}

// ── Tool factory ────────────────────────────────────────────────────────────

/**
 * Create a bash tool that executes shell commands on the server.
 *
 * By default, uses "auto" approval (safe commands run immediately, others
 * require user approval) and "safe" env isolation (strips secret-like
 * environment variables).
 *
 * @example
 * ```ts
 * import { supyagent, createBashTool } from '@supyagent/sdk';
 *
 * const client = supyagent({ apiKey: process.env.SUPYAGENT_API_KEY! });
 * const supyagentTools = await client.tools({ cache: 300 });
 *
 * const tools = {
 *   ...supyagentTools,
 *   bash: createBashTool({ cwd: '/path/to/project' }),
 * };
 * ```
 */
export function createBashTool(options?: BashToolOptions) {
  const cwd = options?.cwd ?? process.cwd();
  const timeout = Math.min(options?.timeout ?? DEFAULT_TIMEOUT, 600_000);
  const maxOutput = options?.maxOutput ?? MAX_OUTPUT;
  const approvalPolicy = options?.approval ?? "auto";

  const extraSafe = options?.allowCommands ? new Set(options.allowCommands) : undefined;
  const extraDeny = options?.denyPatterns;

  const execEnv = buildEnv(options?.env ?? "safe", options);

  const schema = {
    type: "object" as const,
    properties: {
      command: {
        type: "string",
        description: "The bash command to execute",
      },
    },
    required: ["command"],
  };

  // Resolve needsApproval based on policy
  const needsApproval =
    approvalPolicy === "always"
      ? true
      : approvalPolicy === "never"
        ? false
        : async (args: unknown) => {
            const { command } = args as { command: string };
            if (typeof approvalPolicy === "function") {
              return approvalPolicy(command);
            }
            // "auto" mode — safe commands pass, everything else needs approval
            const safety = classifyCommand(command, extraSafe, extraDeny);
            return safety !== "safe";
          };

  return tool({
    description:
      "Execute a bash command on the server. Use this for running shell commands, scripts, package managers, git operations, file manipulation, and system tasks. Returns stdout, stderr, and exit code.",
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    needsApproval,
    execute: async (args): Promise<BashToolResult> => {
      const { command } = args as { command: string };

      // Block dangerous commands even if somehow approved
      if (
        DANGEROUS_PATTERNS.some(p => p.test(command)) ||
        extraDeny?.some(p => p.test(command))
      ) {
        return {
          stdout: "",
          stderr: "Command blocked by safety policy",
          exitCode: 126,
          durationMs: 0,
        };
      }

      const start = Date.now();

      return new Promise<BashToolResult>((resolve) => {
        const child = exec(
          command,
          {
            cwd,
            timeout,
            shell: "/bin/bash",
            maxBuffer: 10 * 1024 * 1024,
            env: execEnv,
          },
          (error: ExecException | null, stdout: string, stderr: string) => {
            const durationMs = Date.now() - start;
            const timedOut = error?.killed === true;
            const exitCode = timedOut
              ? 124
              : typeof error?.code === "number"
                ? error.code
                : error
                  ? 1
                  : 0;

            resolve({
              stdout: truncate(stdout, maxOutput),
              stderr: truncate(stderr, maxOutput),
              exitCode,
              durationMs,
              ...(timedOut ? { timedOut: true } : {}),
            });
          }
        );

        child.on("error", () => {
          resolve({
            stdout: "",
            stderr: "Failed to start process",
            exitCode: 127,
            durationMs: Date.now() - start,
          });
        });
      });
    },
  });
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  const half = Math.floor(max / 2) - 50;
  return (
    str.slice(0, half) +
    `\n\n... (${str.length - max} characters truncated) ...\n\n` +
    str.slice(-half)
  );
}
