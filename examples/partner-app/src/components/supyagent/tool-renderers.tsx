import type { ComponentType } from "react";
import { GmailRenderer } from "./tools/gmail";
import { CalendarRenderer } from "./tools/calendar";
import { SlackRenderer } from "./tools/slack";
import { GitHubRenderer } from "./tools/github";
import { GenericRenderer } from "./tools/generic";

export interface ToolRendererProps {
  data: unknown;
}

/**
 * Map from formatter type to the component that renders it.
 * This example includes a subset of renderers — add more as needed.
 */
const renderers: Record<string, ComponentType<ToolRendererProps>> = {
  email: GmailRenderer,
  calendar: CalendarRenderer,
  slack: SlackRenderer,
  github: GitHubRenderer,
};

export function getToolRenderer(formatterType: string): ComponentType<ToolRendererProps> {
  return renderers[formatterType] ?? GenericRenderer;
}
