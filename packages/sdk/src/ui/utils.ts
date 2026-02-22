/**
 * Extract provider/service prefix from a tool name.
 * Tool names follow `{service}_{action}` convention.
 */
export function getProviderFromToolName(toolName: string): string {
  const idx = toolName.indexOf("_");
  return idx > 0 ? toolName.slice(0, idx) : toolName;
}

/**
 * Convert a tool name like "gmail_list_messages" to "List messages".
 */
export function humanizeToolName(toolName: string): string {
  const idx = toolName.indexOf("_");
  if (idx < 0) return toolName;
  const action = toolName.slice(idx + 1);
  const words = action.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Provider display names.
 */
export const PROVIDER_LABELS: Record<string, string> = {
  gmail: "Gmail",
  calendar: "Calendar",
  drive: "Drive",
  slack: "Slack",
  github: "GitHub",
  discord: "Discord",
  notion: "Notion",
  hubspot: "HubSpot",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  telegram: "Telegram",
  microsoft: "Microsoft",
  outlook: "Outlook",
  onedrive: "OneDrive",
  whatsapp: "WhatsApp",
  inbox: "Inbox",
  docs: "Docs",
  sheets: "Sheets",
  slides: "Slides",
  search: "Search",
  compute: "Compute",
  resend: "Resend",
  linear: "Linear",
  pipedrive: "Pipedrive",
  stripe: "Stripe",
  jira: "Jira",
  salesforce: "Salesforce",
  brevo: "Brevo",
  calendly: "Calendly",
  twilio: "Twilio",
  image: "Image",
  audio: "Audio",
  video: "Video",
  shopify: "Shopify",
  sap: "SAP",
  jobs: "Jobs",
  browser: "Browser",
  files: "Files",
  db: "Database",
  radar: "Radar",
};

/**
 * Get a display label for a provider.
 */
export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Determine which formatter to use based on tool name prefix.
 */
export type FormatterType =
  | "email"
  | "calendar"
  | "slack"
  | "github"
  | "drive"
  | "search"
  | "docs"
  | "sheets"
  | "slides"
  | "hubspot"
  | "linear"
  | "pipedrive"
  | "compute"
  | "resend"
  | "inbox"
  | "discord"
  | "notion"
  | "twitter"
  | "telegram"
  | "stripe"
  | "jira"
  | "salesforce"
  | "brevo"
  | "calendly"
  | "twilio"
  | "linkedin"
  | "bash"
  | "image"
  | "audio"
  | "video"
  | "whatsapp"
  | "browser"
  | "viewImage"
  | "generic";

/**
 * Microsoft tool name prefixes that map to existing Google formatters.
 */
const MICROSOFT_PREFIX_MAP: Array<[string, FormatterType]> = [
  ["microsoft_mail_", "email"],
  ["microsoft_email_", "email"],
  ["outlook_", "email"],
  ["microsoft_calendar_", "calendar"],
  ["microsoft_drive_", "drive"],
  ["onedrive_", "drive"],
];

export function getFormatterType(toolName: string): FormatterType {
  // Check Microsoft full-name prefixes first
  const lower = toolName.toLowerCase();
  for (const [prefix, type] of MICROSOFT_PREFIX_MAP) {
    if (lower.startsWith(prefix)) return type;
  }

  const provider = getProviderFromToolName(toolName);
  switch (provider) {
    case "gmail":
      return "email";
    case "calendar":
      return "calendar";
    case "slack":
      return "slack";
    case "github":
      return "github";
    case "drive":
      return "drive";
    case "search":
      return "search";
    case "docs":
      return "docs";
    case "sheets":
      return "sheets";
    case "slides":
      return "slides";
    case "hubspot":
      return "hubspot";
    case "linear":
      return "linear";
    case "pipedrive":
      return "pipedrive";
    case "compute":
      return "compute";
    case "resend":
      return "resend";
    case "inbox":
      return "inbox";
    case "discord":
      return "discord";
    case "notion":
      return "notion";
    case "twitter":
      return "twitter";
    case "telegram":
      return "telegram";
    case "stripe":
      return "stripe";
    case "jira":
      return "jira";
    case "salesforce":
      return "salesforce";
    case "brevo":
      return "brevo";
    case "calendly":
      return "calendly";
    case "twilio":
      return "twilio";
    case "linkedin":
      return "linkedin";
    case "whatsapp":
      return "whatsapp";
    case "browser":
      return "browser";
    case "viewImage":
      return "viewImage";
    case "db":
      return "compute";
    case "files":
      return "drive";
    case "radar":
      return "search";
    case "image":
      return "image";
    case "tts":
    case "stt":
      return "audio";
    case "video":
      return "video";
    case "code":
      return "compute";
    case "ocr":
      return "generic";
    case "bash":
    case "shell":
      return "bash";
    default:
      return "generic";
  }
}

/**
 * Resolve a virtual tool name for rendering purposes.
 * For `apiCall`, derives the tool name from the API path in args.
 * For all other tools, returns the raw name unchanged.
 */
export function resolveToolName(
  rawToolName: string,
  args?: Record<string, unknown>
): string {
  if (rawToolName !== "apiCall" || !args) return rawToolName;

  const path = typeof args.path === "string" ? args.path : "";
  // Strip /api/v1/ prefix, join remaining segments with _
  const stripped = path.replace(/^\/api\/v1\//, "");
  if (!stripped || stripped === path) return rawToolName; // no match, keep apiCall

  // Convert path segments to underscore-separated tool name
  // e.g. "gmail/messages" → "gmail_messages"
  // e.g. "microsoft/mail/messages" → "microsoft_mail_messages"
  return stripped.split("/").filter(Boolean).join("_");
}
