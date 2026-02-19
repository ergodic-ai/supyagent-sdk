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
  | "generic";

export function getFormatterType(toolName: string): FormatterType {
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
    default:
      return "generic";
  }
}
