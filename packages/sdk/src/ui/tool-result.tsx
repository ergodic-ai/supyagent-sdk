import React from "react";
import { getFormatterType, resolveToolName, type FormatterType } from "./utils.js";
import { CollapsibleResult } from "./collapsible-result.js";
import { getSummary, type SummaryResult } from "./summaries.js";
import { normalizeMicrosoftMail, normalizeMicrosoftCalendar, normalizeMicrosoftDrive } from "./normalizers.js";
import { EmailFormatter } from "./formatters/email.js";
import { CalendarEventFormatter } from "./formatters/calendar-event.js";
import { SlackMessageFormatter } from "./formatters/slack-message.js";
import { GithubFormatter } from "./formatters/github.js";
import { DriveFileFormatter } from "./formatters/drive-file.js";
import { SearchFormatter } from "./formatters/search.js";
import { DocsFormatter } from "./formatters/docs.js";
import { SheetsFormatter } from "./formatters/sheets.js";
import { SlidesFormatter } from "./formatters/slides.js";
import { HubspotFormatter } from "./formatters/hubspot.js";
import { LinearFormatter } from "./formatters/linear.js";
import { PipedriveFormatter } from "./formatters/pipedrive.js";
import { ComputeFormatter } from "./formatters/compute.js";
import { ResendFormatter } from "./formatters/resend.js";
import { InboxFormatter } from "./formatters/inbox.js";
import { DiscordFormatter } from "./formatters/discord.js";
import { NotionFormatter } from "./formatters/notion.js";
import { TwitterFormatter } from "./formatters/twitter.js";
import { TelegramFormatter } from "./formatters/telegram.js";
import { StripeFormatter } from "./formatters/stripe.js";
import { JiraFormatter } from "./formatters/jira.js";
import { SalesforceFormatter } from "./formatters/salesforce.js";
import { BrevoFormatter } from "./formatters/brevo.js";
import { CalendlyFormatter } from "./formatters/calendly.js";
import { TwilioFormatter } from "./formatters/twilio.js";
import { LinkedInFormatter } from "./formatters/linkedin.js";
import { WhatsAppFormatter } from "./formatters/whatsapp.js";
import { BrowserFormatter } from "./formatters/browser.js";
import { ViewImageFormatter } from "./formatters/view-image.js";
import { GenericFormatter } from "./formatters/generic.js";

export interface ToolResultPart {
  type: string;
  // AI SDK v4+ (tool-{name} or dynamic-tool)
  toolName?: string;
  state?: string;
  output?: unknown;
  input?: unknown;
  // AI SDK v3 (tool-invocation)
  toolInvocation?: {
    toolName: string;
    state: string;
    result?: unknown;
    args?: Record<string, unknown>;
  };
  // Legacy v4 fields
  result?: unknown;
  args?: Record<string, unknown>;
}

interface SupyagentToolResultProps {
  part: ToolResultPart;
}

/**
 * Extract the tool name from a part.
 */
export function extractToolName(part: ToolResultPart): string {
  if (part.type.startsWith("tool-") && part.type !== "tool-invocation") {
    return part.type.slice(5);
  }
  if (part.type === "dynamic-tool" && part.toolName) {
    return part.toolName;
  }
  if (part.toolName) return part.toolName;
  if (part.toolInvocation?.toolName) return part.toolInvocation.toolName;
  return "unknown";
}

export function extractState(part: ToolResultPart): string | undefined {
  return part.state ?? part.toolInvocation?.state;
}

/**
 * Unwrap supyagent's `{ok, data}` envelope so formatters see the inner payload.
 */
export function unwrapSupyagentResult(result: unknown): unknown {
  if (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    "data" in result
  ) {
    return (result as Record<string, unknown>).data;
  }
  return result;
}

export function extractArgs(part: ToolResultPart): Record<string, unknown> | undefined {
  if (part.input && typeof part.input === "object" && !Array.isArray(part.input)) {
    return part.input as Record<string, unknown>;
  }
  if (part.args) return part.args;
  return part.toolInvocation?.args;
}

export function extractResult(part: ToolResultPart): unknown {
  let raw: unknown;
  // v4+: output field
  if ("output" in part && part.output !== undefined) raw = part.output;
  // Legacy: result field
  else if ("result" in part && part.result !== undefined) raw = part.result;
  // v3: toolInvocation.result
  else raw = part.toolInvocation?.result;

  return unwrapSupyagentResult(raw);
}

/**
 * Apply Microsoft data normalization when the formatter type came from a Microsoft tool prefix.
 */
export function maybeNormalize(toolName: string, formatterType: FormatterType, data: unknown): unknown {
  const lower = toolName.toLowerCase();
  const isMicrosoft = lower.startsWith("microsoft_") || lower.startsWith("outlook_") || lower.startsWith("onedrive_");
  if (!isMicrosoft) return data;

  switch (formatterType) {
    case "email":
      return normalizeMicrosoftMail(data);
    case "calendar":
      return normalizeMicrosoftCalendar(data);
    case "drive":
      return normalizeMicrosoftDrive(data);
    default:
      return data;
  }
}

export function renderFormatter(formatterType: FormatterType, data: unknown): React.ReactNode {
  switch (formatterType) {
    case "email":
      return <EmailFormatter data={data} />;
    case "calendar":
      return <CalendarEventFormatter data={data} />;
    case "slack":
      return <SlackMessageFormatter data={data} />;
    case "github":
      return <GithubFormatter data={data} />;
    case "drive":
      return <DriveFileFormatter data={data} />;
    case "search":
      return <SearchFormatter data={data} />;
    case "docs":
      return <DocsFormatter data={data} />;
    case "sheets":
      return <SheetsFormatter data={data} />;
    case "slides":
      return <SlidesFormatter data={data} />;
    case "hubspot":
      return <HubspotFormatter data={data} />;
    case "linear":
      return <LinearFormatter data={data} />;
    case "pipedrive":
      return <PipedriveFormatter data={data} />;
    case "compute":
      return <ComputeFormatter data={data} />;
    case "resend":
      return <ResendFormatter data={data} />;
    case "inbox":
      return <InboxFormatter data={data} />;
    case "discord":
      return <DiscordFormatter data={data} />;
    case "notion":
      return <NotionFormatter data={data} />;
    case "twitter":
      return <TwitterFormatter data={data} />;
    case "telegram":
      return <TelegramFormatter data={data} />;
    case "stripe":
      return <StripeFormatter data={data} />;
    case "jira":
      return <JiraFormatter data={data} />;
    case "salesforce":
      return <SalesforceFormatter data={data} />;
    case "brevo":
      return <BrevoFormatter data={data} />;
    case "calendly":
      return <CalendlyFormatter data={data} />;
    case "twilio":
      return <TwilioFormatter data={data} />;
    case "linkedin":
      return <LinkedInFormatter data={data} />;
    case "whatsapp":
      return <WhatsAppFormatter data={data} />;
    case "browser":
      return <BrowserFormatter data={data} />;
    case "viewImage":
      return <ViewImageFormatter data={data} />;
    default:
      return <GenericFormatter data={data} />;
  }
}

export function SupyagentToolResult({ part }: SupyagentToolResultProps) {
  const state = extractState(part);
  const result = extractResult(part);
  const rawToolName = extractToolName(part);
  const args = extractArgs(part);
  const toolName = resolveToolName(rawToolName, args);

  // Only render when we have a result
  if (state !== "output-available" || result === undefined) {
    return null;
  }

  const formatterType = getFormatterType(toolName);
  const data = maybeNormalize(toolName, formatterType, result);
  const summary: SummaryResult = getSummary(formatterType, data, toolName);

  return (
    <CollapsibleResult
      toolName={toolName}
      summary={summary.text}
      badge={summary.badge}
    >
      {renderFormatter(formatterType, data)}
    </CollapsibleResult>
  );
}
