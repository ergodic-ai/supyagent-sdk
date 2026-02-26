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

// ── Context management UI ────────────────────────────────────────────────────
export { ContextIndicator } from "./ui/context-indicator.js";
export type { ContextIndicatorProps } from "./ui/context-indicator.js";
export { SummaryMessage, isContextSummary } from "./ui/summary-message.js";
export type { SummaryMessageProps } from "./ui/summary-message.js";

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

// ── Connect (popup + callback) ──────────────────────────────────────────────

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { openConnectPopup } from "./connect/popup.js";
import { handleConnectCallback } from "./connect/callback.js";
import type { ConnectPopupOptions, ConnectPopupResult } from "./connect/types.js";

export type { ConnectPopupOptions, ConnectPopupResult } from "./connect/types.js";

/** React hook wrapping openConnectPopup with loading/error state. */
export function useSupyagentConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ConnectPopupResult | null>(null);

  const connect = useCallback(async (options: ConnectPopupOptions) => {
    setIsConnecting(true);
    setError(null);
    setResult(null);
    try {
      const res = await openConnectPopup(options);
      setResult(res);
      return res;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return { connect, isConnecting, error, result };
}

/** Drop-in component for the partner's redirect page. */
export function ConnectCallback({
  children,
  targetOrigin,
  autoClose = true,
}: {
  children?: ReactNode;
  targetOrigin?: string;
  autoClose?: boolean;
}) {
  useEffect(() => {
    handleConnectCallback({ targetOrigin, autoClose });
  }, [targetOrigin, autoClose]);

  return <>{children ?? null}</>;
}
