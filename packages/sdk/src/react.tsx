// ── Data extraction utilities (used by tool-message.tsx) ─────────────────────
export {
  extractToolName,
  extractState,
  extractResult,
  extractArgs,
  unwrapSupyagentResult,
  maybeNormalize,
} from "./ui/tool-result.js";
export type { ToolResultPart } from "./ui/tool-result.js";

// ── Mapping & labels ─────────────────────────────────────────────────────────
export {
  getFormatterType,
  getProviderFromToolName,
  humanizeToolName,
  getProviderLabel,
  resolveToolName,
  PROVIDER_LABELS,
} from "./ui/utils.js";
export type { FormatterType } from "./ui/utils.js";

// ── Summaries ────────────────────────────────────────────────────────────────
export { getSummary } from "./ui/summaries.js";
export type { SummaryResult } from "./ui/summaries.js";

// ── Icon component ───────────────────────────────────────────────────────────
export { ProviderIcon } from "./ui/provider-icon.js";

// ── Input renderer ───────────────────────────────────────────────────────────
export { ToolInput } from "./ui/tool-input.js";

// ── Normalizers (Microsoft data) ─────────────────────────────────────────────
export {
  normalizeMicrosoftMail,
  normalizeMicrosoftCalendar,
  normalizeMicrosoftDrive,
} from "./ui/normalizers.js";

// ── DEPRECATED — kept for backwards compat, will be removed in next major ───
export { SupyagentToolAction } from "./ui/tool-action.js";
export { SupyagentToolResult } from "./ui/tool-result.js";
export { SupyagentToolCall } from "./ui/tool-call.js";
export { CollapsibleResult } from "./ui/collapsible-result.js";
export type { CollapsibleResultProps } from "./ui/collapsible-result.js";

// Individual formatters (deprecated — use local tool renderers instead)
export { EmailFormatter } from "./ui/formatters/email.js";
export { CalendarEventFormatter } from "./ui/formatters/calendar-event.js";
export { SlackMessageFormatter } from "./ui/formatters/slack-message.js";
export { GithubFormatter } from "./ui/formatters/github.js";
export { DriveFileFormatter } from "./ui/formatters/drive-file.js";
export { SearchFormatter } from "./ui/formatters/search.js";
export { DocsFormatter } from "./ui/formatters/docs.js";
export { SheetsFormatter } from "./ui/formatters/sheets.js";
export { SlidesFormatter } from "./ui/formatters/slides.js";
export { HubspotFormatter } from "./ui/formatters/hubspot.js";
export { LinearFormatter } from "./ui/formatters/linear.js";
export { PipedriveFormatter } from "./ui/formatters/pipedrive.js";
export { ComputeFormatter } from "./ui/formatters/compute.js";
export { ResendFormatter } from "./ui/formatters/resend.js";
export { InboxFormatter } from "./ui/formatters/inbox.js";
export { GenericFormatter } from "./ui/formatters/generic.js";
export { DiscordFormatter } from "./ui/formatters/discord.js";
export { NotionFormatter } from "./ui/formatters/notion.js";
export { TwitterFormatter } from "./ui/formatters/twitter.js";
export { TelegramFormatter } from "./ui/formatters/telegram.js";
export { StripeFormatter } from "./ui/formatters/stripe.js";
export { JiraFormatter } from "./ui/formatters/jira.js";
export { SalesforceFormatter } from "./ui/formatters/salesforce.js";
export { BrevoFormatter } from "./ui/formatters/brevo.js";
export { CalendlyFormatter } from "./ui/formatters/calendly.js";
export { TwilioFormatter } from "./ui/formatters/twilio.js";
export { LinkedInFormatter } from "./ui/formatters/linkedin.js";
export { WhatsAppFormatter } from "./ui/formatters/whatsapp.js";
export { BrowserFormatter } from "./ui/formatters/browser.js";
export { ViewImageFormatter } from "./ui/formatters/view-image.js";
