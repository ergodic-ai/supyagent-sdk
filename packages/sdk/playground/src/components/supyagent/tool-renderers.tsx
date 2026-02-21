import type { ComponentType } from "react";
import { GmailRenderer } from "./tools/gmail";
import { CalendarRenderer } from "./tools/calendar";
import { SlackRenderer } from "./tools/slack";
import { GitHubRenderer } from "./tools/github";
import { DriveRenderer } from "./tools/drive";
import { SearchRenderer } from "./tools/search";
import { DocsRenderer } from "./tools/docs";
import { SheetsRenderer } from "./tools/sheets";
import { SlidesRenderer } from "./tools/slides";
import { HubSpotRenderer } from "./tools/hubspot";
import { LinearRenderer } from "./tools/linear";
import { PipedriveRenderer } from "./tools/pipedrive";
import { ComputeRenderer } from "./tools/compute";
import { ResendRenderer } from "./tools/resend";
import { InboxRenderer } from "./tools/inbox";
import { DiscordRenderer } from "./tools/discord";
import { NotionRenderer } from "./tools/notion";
import { TwitterRenderer } from "./tools/twitter";
import { TelegramRenderer } from "./tools/telegram";
import { StripeRenderer } from "./tools/stripe";
import { JiraRenderer } from "./tools/jira";
import { SalesforceRenderer } from "./tools/salesforce";
import { BrevoRenderer } from "./tools/brevo";
import { CalendlyRenderer } from "./tools/calendly";
import { TwilioRenderer } from "./tools/twilio";
import { LinkedInRenderer } from "./tools/linkedin";
import { BashRenderer } from "./tools/bash";
import { ImageRenderer } from "./tools/image";
import { AudioRenderer } from "./tools/audio";
import { VideoRenderer } from "./tools/video";
import { GenericRenderer } from "./tools/generic";

export interface ToolRendererProps {
  data: unknown;
}

/**
 * Map from formatter type to the component that renders it.
 * Add your own custom tool renderers here!
 */
const renderers: Record<string, ComponentType<ToolRendererProps>> = {
  email: GmailRenderer,
  calendar: CalendarRenderer,
  slack: SlackRenderer,
  github: GitHubRenderer,
  drive: DriveRenderer,
  search: SearchRenderer,
  docs: DocsRenderer,
  sheets: SheetsRenderer,
  slides: SlidesRenderer,
  hubspot: HubSpotRenderer,
  linear: LinearRenderer,
  pipedrive: PipedriveRenderer,
  compute: ComputeRenderer,
  resend: ResendRenderer,
  inbox: InboxRenderer,
  discord: DiscordRenderer,
  notion: NotionRenderer,
  twitter: TwitterRenderer,
  telegram: TelegramRenderer,
  stripe: StripeRenderer,
  jira: JiraRenderer,
  salesforce: SalesforceRenderer,
  brevo: BrevoRenderer,
  calendly: CalendlyRenderer,
  twilio: TwilioRenderer,
  linkedin: LinkedInRenderer,
  bash: BashRenderer,
  image: ImageRenderer,
  audio: AudioRenderer,
  video: VideoRenderer,
};

export function getToolRenderer(formatterType: string): ComponentType<ToolRendererProps> {
  return renderers[formatterType] ?? GenericRenderer;
}
