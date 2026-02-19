import { describe, it, expect } from "vitest";
import { filterTools } from "../src/core/tool-converter.js";
import type { OpenAITool } from "../src/core/types.js";

const MOCK_TOOLS: OpenAITool[] = [
  {
    type: "function",
    function: {
      name: "gmail_list_messages",
      description: "List emails",
      parameters: { type: "object", properties: {} },
    },
    metadata: {
      provider: "google",
      service: "gmail",
      permission: "gmail.read",
      method: "GET",
      path: "/api/v1/gmail/messages",
    },
  },
  {
    type: "function",
    function: {
      name: "calendar_list_events",
      description: "List events",
      parameters: { type: "object", properties: {} },
    },
    metadata: {
      provider: "google",
      service: "calendar",
      permission: "calendar.read",
      method: "GET",
      path: "/api/v1/calendar/events",
    },
  },
  {
    type: "function",
    function: {
      name: "slack_send_message",
      description: "Send Slack message",
      parameters: { type: "object", properties: {} },
    },
    metadata: {
      provider: "slack",
      service: "slack",
      permission: "slack.write",
      method: "POST",
      path: "/api/v1/slack/messages",
    },
  },
];

describe("filterTools", () => {
  it("returns all tools when no filters", () => {
    expect(filterTools(MOCK_TOOLS, {})).toHaveLength(3);
  });

  it("filters by provider name with only", () => {
    const result = filterTools(MOCK_TOOLS, { only: ["slack"] });
    expect(result).toHaveLength(1);
    expect(result[0].function.name).toBe("slack_send_message");
  });

  it("filters by service name with only", () => {
    const result = filterTools(MOCK_TOOLS, { only: ["gmail"] });
    expect(result).toHaveLength(1);
    expect(result[0].function.name).toBe("gmail_list_messages");
  });

  it("filters by tool name with only", () => {
    const result = filterTools(MOCK_TOOLS, { only: ["calendar_list_events"] });
    expect(result).toHaveLength(1);
    expect(result[0].function.name).toBe("calendar_list_events");
  });

  it("filters multiple values with only", () => {
    const result = filterTools(MOCK_TOOLS, { only: ["gmail", "slack"] });
    expect(result).toHaveLength(2);
  });

  it("excludes by provider with except", () => {
    const result = filterTools(MOCK_TOOLS, { except: ["google"] });
    expect(result).toHaveLength(1);
    expect(result[0].function.name).toBe("slack_send_message");
  });

  it("excludes by tool name with except", () => {
    const result = filterTools(MOCK_TOOLS, { except: ["slack_send_message"] });
    expect(result).toHaveLength(2);
  });

  it("is case insensitive", () => {
    const result = filterTools(MOCK_TOOLS, { only: ["Gmail"] });
    expect(result).toHaveLength(1);
  });

  it("combines only and except", () => {
    const result = filterTools(MOCK_TOOLS, { only: ["google"], except: ["calendar"] });
    expect(result).toHaveLength(1);
    expect(result[0].function.name).toBe("gmail_list_messages");
  });
});
