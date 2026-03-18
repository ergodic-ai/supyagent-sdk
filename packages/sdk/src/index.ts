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
  // Tool discovery
  ScoredTool,
  ToolSearchResponse,
  ToolListResponse,
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
export { createEditFileTool } from "./tools/edit-file.js";
export type { EditFileToolOptions, EditFileToolResult } from "./tools/edit-file.js";
export { createGrepTool } from "./tools/grep.js";
export type { GrepToolOptions, GrepToolResult } from "./tools/grep.js";
export { createFindTool } from "./tools/find.js";
export type { FindToolOptions, FindToolResult } from "./tools/find.js";
export { createReadFileRangeTool } from "./tools/read-file-range.js";
export type { ReadFileRangeToolOptions, ReadFileRangeToolResult } from "./tools/read-file-range.js";
export { createAppendFileTool } from "./tools/append-file.js";
export type { AppendFileToolOptions, AppendFileToolResult } from "./tools/append-file.js";
export { createHttpRequestTool } from "./tools/http-request.js";
export type { HttpRequestToolOptions, HttpRequestToolResult } from "./tools/http-request.js";
