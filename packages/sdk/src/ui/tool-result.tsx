import React from "react";
import { getFormatterType, getProviderFromToolName } from "./utils.js";
import { EmailFormatter } from "./formatters/email.js";
import { CalendarEventFormatter } from "./formatters/calendar-event.js";
import { SlackMessageFormatter } from "./formatters/slack-message.js";
import { GithubFormatter } from "./formatters/github.js";
import { DriveFileFormatter } from "./formatters/drive-file.js";
import { GenericFormatter } from "./formatters/generic.js";

interface ToolResultPart {
  type: string;
  toolInvocation?: {
    toolName: string;
    state: string;
    result?: unknown;
  };
  toolName?: string;
  state?: string;
  result?: unknown;
}

interface SupyagentToolResultProps {
  part: ToolResultPart;
}

export function SupyagentToolResult({ part }: SupyagentToolResultProps) {
  const state = part.state ?? part.toolInvocation?.state;
  const result = "result" in part ? part.result : part.toolInvocation?.result;
  const toolName = part.toolName ?? part.toolInvocation?.toolName ?? "unknown";

  // Only render when we have a result
  if (state !== "output-available" || result === undefined) {
    return null;
  }

  const formatterType = getFormatterType(toolName);

  // Route to provider-specific formatter
  switch (formatterType) {
    case "email":
      return <EmailFormatter data={result} />;
    case "calendar":
      return <CalendarEventFormatter data={result} />;
    case "slack":
      return <SlackMessageFormatter data={result} />;
    case "github":
      return <GithubFormatter data={result} />;
    case "drive":
      return <DriveFileFormatter data={result} />;
    default:
      return <GenericFormatter data={result} />;
  }
}
