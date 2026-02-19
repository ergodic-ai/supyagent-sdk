import { describe, it, expect } from "vitest";
import {
  getProviderFromToolName,
  humanizeToolName,
  getProviderLabel,
  getFormatterType,
} from "../src/ui/utils.js";

describe("getProviderFromToolName", () => {
  it("extracts provider from tool name", () => {
    expect(getProviderFromToolName("gmail_list_messages")).toBe("gmail");
    expect(getProviderFromToolName("calendar_create_event")).toBe("calendar");
    expect(getProviderFromToolName("slack_send_message")).toBe("slack");
  });

  it("returns full name if no underscore", () => {
    expect(getProviderFromToolName("unknown")).toBe("unknown");
  });
});

describe("humanizeToolName", () => {
  it("converts tool names to readable labels", () => {
    expect(humanizeToolName("gmail_list_messages")).toBe("List messages");
    expect(humanizeToolName("calendar_create_event")).toBe("Create event");
    expect(humanizeToolName("slack_send_message")).toBe("Send message");
  });

  it("returns name as-is if no underscore", () => {
    expect(humanizeToolName("unknown")).toBe("unknown");
  });
});

describe("getProviderLabel", () => {
  it("returns known provider labels", () => {
    expect(getProviderLabel("gmail")).toBe("Gmail");
    expect(getProviderLabel("github")).toBe("GitHub");
    expect(getProviderLabel("hubspot")).toBe("HubSpot");
  });

  it("capitalizes unknown providers", () => {
    expect(getProviderLabel("custom")).toBe("Custom");
  });
});

describe("getFormatterType", () => {
  it("maps providers to formatter types", () => {
    expect(getFormatterType("gmail_list_messages")).toBe("email");
    expect(getFormatterType("calendar_list_events")).toBe("calendar");
    expect(getFormatterType("slack_send_message")).toBe("slack");
    expect(getFormatterType("github_list_issues")).toBe("github");
    expect(getFormatterType("drive_list_files")).toBe("drive");
    expect(getFormatterType("notion_get_page")).toBe("generic");
  });
});
