export { supyagent } from "./core/client.js";
export type {
  SupyagentOptions,
  SupyagentClient,
  ScopedClient,
  ToolFilterOptions,
  ToolMetadata,
  OpenAITool,
  ToolsResponse,
  SkillsOptions,
  SkillsResult,
  ParsedSkill,
  ParsedSkillsDocument,
  MeOptions,
  MeResponse,
  // Connected accounts
  ConnectedAccount,
  ConnectedAccountWithIntegrations,
  AccountIntegration,
  AccountIntegrationDetail,
  CreateAccountOptions,
  UpdateAccountOptions,
  ListAccountsOptions,
  ListAccountsResponse,
  ConnectOptions,
  ConnectSession,
  ConnectSessionStatus,
  AccountsClient,
} from "./core/types.js";
export { createBashTool } from "./tools/bash.js";
export type { BashToolOptions, BashToolResult } from "./tools/bash.js";
export { createViewImageTool } from "./tools/view-image.js";
export type { ViewImageToolOptions, ViewImageToolResult } from "./tools/view-image.js";
export { parseSkillsMarkdown, buildSkillsSystemPrompt, findSkill } from "./core/skill-parser.js";
export { createLoadSkillTool, createApiCallTool } from "./tools/skills.js";
