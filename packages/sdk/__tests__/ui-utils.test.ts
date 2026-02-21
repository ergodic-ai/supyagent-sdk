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

  it("returns new provider labels", () => {
    expect(getProviderLabel("stripe")).toBe("Stripe");
    expect(getProviderLabel("jira")).toBe("Jira");
    expect(getProviderLabel("salesforce")).toBe("Salesforce");
    expect(getProviderLabel("brevo")).toBe("Brevo");
    expect(getProviderLabel("calendly")).toBe("Calendly");
    expect(getProviderLabel("twilio")).toBe("Twilio");
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
  });

  it("maps new providers to formatter types", () => {
    expect(getFormatterType("discord_list_channels")).toBe("discord");
    expect(getFormatterType("notion_get_page")).toBe("notion");
    expect(getFormatterType("twitter_list_tweets")).toBe("twitter");
    expect(getFormatterType("telegram_send_message")).toBe("telegram");
    expect(getFormatterType("stripe_list_customers")).toBe("stripe");
    expect(getFormatterType("jira_list_issues")).toBe("jira");
    expect(getFormatterType("salesforce_list_contacts")).toBe("salesforce");
    expect(getFormatterType("brevo_list_contacts")).toBe("brevo");
    expect(getFormatterType("calendly_list_events")).toBe("calendly");
    expect(getFormatterType("twilio_send_sms")).toBe("twilio");
    expect(getFormatterType("linkedin_get_profile")).toBe("linkedin");
  });

  it("maps Microsoft prefixes to Google formatters", () => {
    expect(getFormatterType("microsoft_mail_list_messages")).toBe("email");
    expect(getFormatterType("microsoft_email_send")).toBe("email");
    expect(getFormatterType("outlook_list_messages")).toBe("email");
    expect(getFormatterType("microsoft_calendar_list_events")).toBe("calendar");
    expect(getFormatterType("microsoft_drive_list_files")).toBe("drive");
    expect(getFormatterType("onedrive_list_files")).toBe("drive");
  });

  it("returns generic for unknown providers", () => {
    expect(getFormatterType("unknown_tool")).toBe("generic");
  });
});
