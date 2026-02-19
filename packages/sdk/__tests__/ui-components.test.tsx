import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { SupyagentToolCall } from "../src/ui/tool-call.js";
import { SupyagentToolResult } from "../src/ui/tool-result.js";

describe("SupyagentToolCall", () => {
  it("renders tool name and provider", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "input-available",
      args: { maxResults: 5 },
    };

    render(<SupyagentToolCall part={part} />);

    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("List messages")).toBeTruthy();
  });

  it("shows running state for streaming", () => {
    const part = {
      type: "tool-invocation",
      toolName: "slack_send_message",
      state: "input-streaming",
    };

    render(<SupyagentToolCall part={part} />);

    expect(screen.getByText("Running...")).toBeTruthy();
  });

  it("handles legacy toolInvocation format", () => {
    const part = {
      type: "tool-invocation",
      toolInvocation: {
        toolName: "calendar_list_events",
        state: "output-available",
        args: {},
        result: {},
      },
    };

    render(<SupyagentToolCall part={part} />);

    expect(screen.getByText("Calendar")).toBeTruthy();
    expect(screen.getByText("List events")).toBeTruthy();
  });
});

describe("SupyagentToolResult", () => {
  it("renders nothing when state is not output-available", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "input-available",
    };

    const { container } = render(<SupyagentToolResult part={part} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders email formatter for gmail tools", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "output-available",
      result: {
        messages: [
          { id: "1", subject: "Test Email", from: "test@example.com", snippet: "Hello there" },
        ],
      },
    };

    render(<SupyagentToolResult part={part} />);

    expect(screen.getByText("Test Email")).toBeTruthy();
    expect(screen.getByText("test@example.com")).toBeTruthy();
  });

  it("renders generic formatter for unknown tools", () => {
    const part = {
      type: "tool-invocation",
      toolName: "notion_get_page",
      state: "output-available",
      result: { title: "My Page" },
    };

    render(<SupyagentToolResult part={part} />);

    // Should render as JSON
    const pre = document.querySelector("pre");
    expect(pre?.textContent).toContain('"title": "My Page"');
  });

  it("renders calendar formatter for calendar tools", () => {
    const part = {
      type: "tool-invocation",
      toolName: "calendar_list_events",
      state: "output-available",
      result: {
        events: [
          { id: "1", summary: "Team Meeting", start: { dateTime: "2025-01-01T10:00:00Z" } },
        ],
      },
    };

    render(<SupyagentToolResult part={part} />);
    expect(screen.getByText("Team Meeting")).toBeTruthy();
  });

  it("handles null result", () => {
    const part = {
      type: "tool-invocation",
      toolName: "notion_get_page",
      state: "output-available",
      result: null,
    };

    render(<SupyagentToolResult part={part} />);
    expect(screen.getByText("No data returned")).toBeTruthy();
  });
});
