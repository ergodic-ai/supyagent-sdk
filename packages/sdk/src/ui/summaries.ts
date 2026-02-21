import { humanizeToolName } from "./utils.js";

export interface SummaryResult {
  text: string;
  badge?: { text: string; variant?: "default" | "success" | "error" | "warning" };
}

function countItems(data: unknown, ...keys: string[]): number {
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object" && data !== null) {
    for (const key of keys) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val.length;
    }
  }
  return 0;
}

function actionFromToolName(toolName: string): string {
  const lower = toolName.toLowerCase();
  if (lower.includes("send") || lower.includes("create") || lower.includes("post")) return "send";
  if (lower.includes("list") || lower.includes("search") || lower.includes("fetch") || lower.includes("get_all")) return "list";
  return "get";
}

function countBadge(n: number): SummaryResult["badge"] | undefined {
  return n > 0 ? { text: String(n), variant: "default" } : undefined;
}

export function getEmailSummary(data: unknown, toolName: string): SummaryResult {
  const action = actionFromToolName(toolName);
  if (action === "send") {
    const to = typeof data === "object" && data !== null && "to" in data
      ? String((data as any).to) : undefined;
    return { text: to ? `Sent email to ${to}` : "Sent email", badge: { text: "Sent", variant: "success" } };
  }
  const n = countItems(data, "messages");
  if (n > 0) return { text: `Listed ${n} emails`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "subject" in data) {
    return { text: `Email: ${(data as any).subject}` };
  }
  return { text: "Email result" };
}

export function getCalendarSummary(data: unknown, toolName: string): SummaryResult {
  const action = actionFromToolName(toolName);
  if (action === "send") {
    const summary = typeof data === "object" && data !== null && "summary" in data
      ? String((data as any).summary) : undefined;
    return { text: summary ? `Created event: ${summary}` : "Created event", badge: { text: "Created", variant: "success" } };
  }
  const n = countItems(data, "events", "items");
  if (n > 0) return { text: `Listed ${n} events`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "summary" in data) {
    return { text: String((data as any).summary) };
  }
  return { text: "Calendar result" };
}

export function getSlackSummary(data: unknown, toolName: string): SummaryResult {
  const action = actionFromToolName(toolName);
  // Channel list
  if (typeof data === "object" && data !== null && "channels" in data) {
    const n = Array.isArray((data as any).channels) ? (data as any).channels.length : 0;
    return { text: `Listed ${n} channels`, badge: countBadge(n) };
  }
  if (action === "send") {
    const ch = typeof data === "object" && data !== null && "channel" in data
      ? String((data as any).channel) : undefined;
    return { text: ch ? `Sent message to #${ch}` : "Sent message", badge: { text: "Sent", variant: "success" } };
  }
  const n = countItems(data, "messages");
  if (n > 0) {
    const ch = typeof data === "object" && data !== null && "channel" in data
      ? String((data as any).channel) : undefined;
    return { text: ch ? `${n} messages in #${ch}` : `${n} messages`, badge: countBadge(n) };
  }
  return { text: "Slack result" };
}

export function getGithubSummary(data: unknown, toolName: string): SummaryResult {
  const n = countItems(data);
  if (n > 0) {
    const isPR = toolName.toLowerCase().includes("pull") || toolName.toLowerCase().includes("pr");
    return { text: isPR ? `Listed ${n} pull requests` : `Listed ${n} issues`, badge: countBadge(n) };
  }
  if (typeof data === "object" && data !== null && "title" in data) {
    const num = "number" in data ? ` #${(data as any).number}` : "";
    return { text: `${(data as any).title}${num}` };
  }
  return { text: "GitHub result" };
}

export function getDriveSummary(data: unknown, toolName: string): SummaryResult {
  const n = countItems(data, "files");
  if (n > 0) return { text: `Listed ${n} files`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "name" in data) {
    return { text: String((data as any).name) };
  }
  return { text: "Drive result" };
}

export function getSearchSummary(data: unknown): SummaryResult {
  let n = 0;
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.results)) n = d.results.length;
    else if (Array.isArray(d.organic)) n = d.organic.length;
  }
  if (n > 0) return { text: `Found ${n} results`, badge: countBadge(n) };
  return { text: "Search result" };
}

export function getDocsSummary(data: unknown): SummaryResult {
  if (typeof data === "object" && data !== null && "title" in data) {
    return { text: `Document: ${(data as any).title}` };
  }
  return { text: "Document result" };
}

export function getSheetsSummary(data: unknown): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.updatedCells) return { text: `Updated ${d.updatedCells} cells`, badge: countBadge(Number(d.updatedCells)) };
    if (d.title) return { text: `Spreadsheet: ${d.title}` };
  }
  return { text: "Sheets result" };
}

export function getSlidesSummary(data: unknown): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const slideCount = Array.isArray(d.slides) ? d.slides.length : undefined;
    if (d.title) {
      return { text: `Presentation: ${d.title}`, badge: slideCount ? countBadge(slideCount) : undefined };
    }
  }
  return { text: "Slides result" };
}

export function getHubspotSummary(data: unknown, toolName: string): SummaryResult {
  const tl = toolName.toLowerCase();
  const isDeal = tl.includes("deal");
  const isCompany = tl.includes("compan");
  const n = countItems(data, "results", "contacts", "companies", "deals");
  if (n > 0) {
    const label = isDeal ? "deals" : isCompany ? "companies" : "contacts";
    return { text: `Listed ${n} ${label}`, badge: countBadge(n) };
  }
  if (isDeal) return { text: "Deal result" };
  return { text: isCompany ? "Company result" : "Contact result" };
}

export function getLinearSummary(data: unknown, toolName: string): SummaryResult {
  const n = countItems(data, "nodes", "issues", "projects");
  if (n > 0) return { text: `Listed ${n} issues`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "identifier" in data && "title" in data) {
    return { text: `${(data as any).identifier} ${(data as any).title}` };
  }
  return { text: "Linear result" };
}

export function getPipedriveSummary(data: unknown): SummaryResult {
  const n = countItems(data, "data");
  if (n > 0) return { text: `Listed ${n} deals`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "title" in data) {
    return { text: String((data as any).title) };
  }
  return { text: "Pipedrive result" };
}

export function getComputeSummary(data: unknown): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const exitCode = (d.exit_code ?? d.exitCode) as number | undefined;
    if (exitCode !== undefined && exitCode !== 0) {
      return { text: "Execution failed", badge: { text: `exit ${exitCode}`, variant: "error" } };
    }
    return { text: "Execution completed", badge: exitCode !== undefined ? { text: `exit ${exitCode}`, variant: "success" } : undefined };
  }
  return { text: "Compute result" };
}

export function getResendSummary(data: unknown): SummaryResult {
  const d = typeof data === "object" && data !== null && "data" in data ? (data as any).data : data;
  if (typeof d === "object" && d !== null && "to" in d) {
    const to = Array.isArray(d.to) ? d.to.join(", ") : String(d.to);
    return { text: `Sent email to ${to}`, badge: { text: "Sent", variant: "success" } };
  }
  return { text: "Email sent", badge: { text: "Sent", variant: "success" } };
}

export function getInboxSummary(data: unknown): SummaryResult {
  const n = countItems(data, "events");
  if (n > 0) return { text: `Listed ${n} notifications`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "title" in data) {
    return { text: String((data as any).title) };
  }
  return { text: "Inbox result" };
}

export function getDiscordSummary(data: unknown, toolName: string): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.guilds)) return { text: `Listed ${d.guilds.length} servers`, badge: countBadge(d.guilds.length) };
    if (Array.isArray(d.channels)) return { text: `Listed ${d.channels.length} channels`, badge: countBadge(d.channels.length) };
  }
  const action = actionFromToolName(toolName);
  if (action === "send") {
    const ch = typeof data === "object" && data !== null && "channel" in data
      ? `#${(data as any).channel}` : undefined;
    return { text: ch ? `Message in ${ch}` : "Sent message", badge: { text: "Sent", variant: "success" } };
  }
  const n = countItems(data, "messages");
  if (n > 0) return { text: `Listed ${n} messages`, badge: countBadge(n) };
  return { text: "Discord result" };
}

export function getNotionSummary(data: unknown, toolName: string): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.pages)) return { text: `Listed ${d.pages.length} pages`, badge: countBadge(d.pages.length) };
    if (Array.isArray(d.databases)) return { text: `Listed ${d.databases.length} databases`, badge: countBadge(d.databases.length) };
    if (Array.isArray(d.results)) {
      const n = d.results.length;
      const isDB = toolName.toLowerCase().includes("database");
      return { text: isDB ? `Listed ${n} databases` : `Listed ${n} pages`, badge: countBadge(n) };
    }
  }
  if (typeof data === "object" && data !== null && "title" in data) {
    return { text: `Page: ${(data as any).title}` };
  }
  // Check for nested Notion title format
  if (typeof data === "object" && data !== null && "properties" in data) {
    return { text: "Page result" };
  }
  return { text: "Notion result" };
}

export function getTwitterSummary(data: unknown): SummaryResult {
  const n = countItems(data, "tweets", "data");
  if (n > 0) return { text: `Listed ${n} tweets`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const author = d.author_username || d.username;
    if (d.text && author) return { text: `Tweet by @${author}` };
  }
  return { text: "Twitter result" };
}

export function getTelegramSummary(data: unknown, toolName: string): SummaryResult {
  const action = actionFromToolName(toolName);
  if (action === "send") {
    const chat = typeof data === "object" && data !== null && "chat" in data
      ? (data as any).chat?.title || (data as any).chat?.username
      : undefined;
    return { text: chat ? `Sent message to ${chat}` : "Sent message", badge: { text: "Sent", variant: "success" } };
  }
  const n = countItems(data, "messages", "result");
  if (n > 0) return { text: `${n} messages`, badge: countBadge(n) };
  return { text: "Telegram result" };
}

export function getStripeSummary(data: unknown, toolName: string): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    // Balance
    if (Array.isArray(d.available) || Array.isArray(d.pending)) {
      const amt = Array.isArray(d.available) && d.available.length > 0
        ? `${(d.available[0].amount / 100).toFixed(2)} ${String(d.available[0].currency).toUpperCase()}`
        : undefined;
      return { text: amt ? `Balance: ${amt}` : "Balance", badge: amt ? { text: amt, variant: "default" } : undefined };
    }
    if (Array.isArray(d.data)) {
      const n = d.data.length;
      const lower = toolName.toLowerCase();
      if (lower.includes("customer")) return { text: `Listed ${n} customers`, badge: countBadge(n) };
      if (lower.includes("invoice")) return { text: `Listed ${n} invoices`, badge: countBadge(n) };
      if (lower.includes("subscri")) return { text: `Listed ${n} subscriptions`, badge: countBadge(n) };
      if (lower.includes("charge") || lower.includes("payment")) return { text: `Listed ${n} payments`, badge: countBadge(n) };
      return { text: `Listed ${n} items`, badge: countBadge(n) };
    }
  }
  return { text: "Stripe result" };
}

export function getJiraSummary(data: unknown): SummaryResult {
  const n = countItems(data, "issues", "projects");
  if (n > 0) return { text: `Listed ${n} issues`, badge: countBadge(n) };
  if (typeof data === "object" && data !== null && "key" in data && "fields" in data) {
    const fields = (data as any).fields;
    return { text: `${(data as any).key}: ${fields?.summary || "Issue"}` };
  }
  return { text: "Jira result" };
}

export function getSalesforceSummary(data: unknown, toolName: string): SummaryResult {
  const n = countItems(data, "records");
  const isOpp = toolName.toLowerCase().includes("opportunit");
  if (n > 0) return { text: isOpp ? `Listed ${n} opportunities` : `Listed ${n} contacts`, badge: countBadge(n) };
  return { text: "Salesforce result" };
}

export function getBrevoSummary(data: unknown, toolName: string): SummaryResult {
  const action = actionFromToolName(toolName);
  if (action === "send") {
    const to = typeof data === "object" && data !== null && "to" in data
      ? String((data as any).to) : undefined;
    return { text: to ? `Sent email to ${to}` : "Sent email", badge: { text: "Sent", variant: "success" } };
  }
  const n = countItems(data, "contacts", "campaigns");
  const isCampaign = toolName.toLowerCase().includes("campaign");
  if (n > 0) return { text: isCampaign ? `Listed ${n} campaigns` : `Listed ${n} contacts`, badge: countBadge(n) };
  return { text: "Brevo result" };
}

export function getCalendlySummary(data: unknown): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.collection)) {
      const n = d.collection.length;
      // Detect event types vs scheduled events
      const first = n > 0 ? (d.collection[0] as any) : null;
      const isType = first && ("duration" in first || "slug" in first);
      return { text: isType ? `Listed ${n} event types` : `Listed ${n} events`, badge: countBadge(n) };
    }
    if (Array.isArray(d.scheduled_events)) return { text: `Listed ${d.scheduled_events.length} events`, badge: countBadge(d.scheduled_events.length) };
    if (Array.isArray(d.event_types)) return { text: `Listed ${d.event_types.length} event types`, badge: countBadge(d.event_types.length) };
  }
  return { text: "Calendly result" };
}

export function getTwilioSummary(data: unknown, toolName: string): SummaryResult {
  const action = actionFromToolName(toolName);
  if (action === "send") {
    const to = typeof data === "object" && data !== null && "to" in data
      ? String((data as any).to) : undefined;
    return { text: to ? `Sent SMS to ${to}` : "Sent SMS", badge: { text: "Sent", variant: "success" } };
  }
  const n = countItems(data, "messages");
  if (n > 0) return { text: `Listed ${n} messages`, badge: countBadge(n) };
  return { text: "Twilio result" };
}

export function getLinkedinSummary(data: unknown): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.posts) || Array.isArray(d.elements)) {
      const n = (d.posts as unknown[] || d.elements as unknown[]).length;
      return { text: `Listed ${n} posts`, badge: countBadge(n) };
    }
    if (d.localizedFirstName || d.firstName || d.name) {
      const name = d.name || [d.localizedFirstName, d.localizedLastName].filter(Boolean).join(" ");
      return { text: `Profile: ${name}` };
    }
  }
  return { text: "LinkedIn result" };
}

export function getImageSummary(data: unknown, toolName: string): SummaryResult {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.status === "processing" || d.poll_url) {
      return { text: "Generating image...", badge: { text: "processing", variant: "warning" } };
    }
    if (d.image_url) {
      return { text: "Image generated", badge: { text: "done", variant: "success" } };
    }
  }
  return { text: humanizeToolName(toolName) };
}

export function getAudioSummary(data: unknown, toolName: string): SummaryResult {
  const isTTS = toolName.toLowerCase().startsWith("tts");
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.status === "processing" || d.poll_url) {
      return {
        text: isTTS ? "Generating audio..." : "Transcribing...",
        badge: { text: "processing", variant: "warning" },
      };
    }
    if (d.audio_url) {
      return { text: "Audio generated", badge: { text: "done", variant: "success" } };
    }
    if (d.result && typeof d.result === "object" && "text" in (d.result as Record<string, unknown>)) {
      return { text: "Transcription complete", badge: { text: "done", variant: "success" } };
    }
  }
  return { text: isTTS ? "Text-to-speech" : "Transcription" };
}

export function getVideoSummary(data: unknown, toolName: string): SummaryResult {
  const isUnderstand = toolName.toLowerCase().includes("understand");
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (d.status === "processing" || d.poll_url) {
      return {
        text: isUnderstand ? "Analyzing video..." : "Generating video...",
        badge: { text: "processing", variant: "warning" },
      };
    }
    if (d.answer) {
      return { text: "Video analysis complete", badge: { text: "done", variant: "success" } };
    }
    if (d.result && typeof d.result === "object") {
      return { text: "Video generated", badge: { text: "done", variant: "success" } };
    }
  }
  return { text: isUnderstand ? "Video analysis" : "Video generation" };
}

export function getBashSummary(data: unknown): SummaryResult {
  if (typeof data !== "object" || data === null) return { text: "Command executed" };
  const d = data as Record<string, unknown>;
  const exitCode = (d.exitCode ?? d.exit_code ?? 0) as number;
  const timedOut = d.timedOut ?? d.timed_out;
  if (timedOut) return { text: "Command timed out", badge: { text: "timeout", variant: "warning" } };
  if (exitCode === 0) return { text: "Command succeeded", badge: { text: "exit 0", variant: "success" } };
  return { text: `Command failed`, badge: { text: `exit ${exitCode}`, variant: "error" } };
}

export function getGenericSummary(_data: unknown, toolName: string): SummaryResult {
  return { text: humanizeToolName(toolName) };
}

export type SummaryFn = (data: unknown, toolName: string) => SummaryResult;

export const SUMMARY_MAP: Record<string, SummaryFn> = {
  email: getEmailSummary,
  calendar: getCalendarSummary,
  slack: getSlackSummary,
  github: getGithubSummary,
  drive: getDriveSummary,
  search: getSearchSummary,
  docs: getDocsSummary,
  sheets: getSheetsSummary,
  slides: getSlidesSummary,
  hubspot: getHubspotSummary,
  linear: getLinearSummary,
  pipedrive: getPipedriveSummary,
  compute: getComputeSummary,
  resend: getResendSummary,
  inbox: getInboxSummary,
  discord: getDiscordSummary,
  notion: getNotionSummary,
  twitter: getTwitterSummary,
  telegram: getTelegramSummary,
  stripe: getStripeSummary,
  jira: getJiraSummary,
  salesforce: getSalesforceSummary,
  brevo: getBrevoSummary,
  calendly: getCalendlySummary,
  twilio: getTwilioSummary,
  linkedin: getLinkedinSummary,
  image: getImageSummary,
  audio: getAudioSummary,
  video: getVideoSummary,
  bash: getBashSummary,
  generic: getGenericSummary,
};

export function getSummary(formatterType: string, data: unknown, toolName: string): SummaryResult {
  const fn = SUMMARY_MAP[formatterType] || getGenericSummary;
  return fn(data, toolName);
}
