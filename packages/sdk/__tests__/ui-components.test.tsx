import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SupyagentToolCall } from "../src/ui/tool-call.js";
import { SupyagentToolResult } from "../src/ui/tool-result.js";
import { SupyagentToolAction } from "../src/ui/tool-action.js";
import { ToolInput } from "../src/ui/tool-input.js";
import { CollapsibleResult } from "../src/ui/collapsible-result.js";

describe("SupyagentToolCall", () => {
  it("renders tool name and provider (legacy toolName field)", () => {
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

  it("renders tool name from type prefix (AI SDK v4+)", () => {
    const part = {
      type: "tool-gmail_list_messages",
      state: "input-available",
      input: { maxResults: 5 },
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

    expect(screen.getByText("Calling...")).toBeTruthy();
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

  it("renders email formatter for gmail tools (legacy result field)", () => {
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

    // CollapsibleResult shows summary bar with provider label
    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("Listed 1 emails")).toBeTruthy();
  });

  it("renders email formatter for gmail tools (v4+ output field)", () => {
    const part = {
      type: "tool-gmail_list_messages",
      state: "output-available",
      output: {
        messages: [
          { id: "1", subject: "V4 Email", from: "v4@example.com", snippet: "New format" },
        ],
      },
    };

    render(<SupyagentToolResult part={part} />);

    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("Listed 1 emails")).toBeTruthy();
  });

  it("renders notion formatter for notion tools", () => {
    const part = {
      type: "tool-invocation",
      toolName: "notion_get_page",
      state: "output-available",
      result: { id: "abc", properties: { Name: { title: [{ plain_text: "My Page" }] } }, url: "https://notion.so/abc" },
    };

    render(<SupyagentToolResult part={part} />);

    expect(screen.getByText("Notion")).toBeTruthy();
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
    expect(screen.getByText("Calendar")).toBeTruthy();
    expect(screen.getByText("Listed 1 events")).toBeTruthy();
  });

  it("handles null result", () => {
    const part = {
      type: "tool-invocation",
      toolName: "unknown_tool",
      state: "output-available",
      result: null,
    };

    render(<SupyagentToolResult part={part} />);
    expect(screen.getByText("No data returned")).toBeTruthy();
  });

  it("renders new formatter types with collapsible wrapper", () => {
    const part = {
      type: "tool-invocation",
      toolName: "stripe_list_customers",
      state: "output-available",
      result: { data: [{ id: "cus_1", name: "John", email: "john@test.com" }] },
    };

    render(<SupyagentToolResult part={part} />);
    expect(screen.getByText("Stripe")).toBeTruthy();
    expect(screen.getByText("Listed 1 customers")).toBeTruthy();
  });
});

describe("CollapsibleResult", () => {
  it("renders collapsed bar with summary", () => {
    render(
      <CollapsibleResult toolName="gmail_list_messages" summary="Listed 5 emails">
        <div>Content</div>
      </CollapsibleResult>,
    );

    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("Listed 5 emails")).toBeTruthy();
  });

  it("renders badge when provided", () => {
    render(
      <CollapsibleResult
        toolName="slack_send_message"
        summary="Sent message to #general"
        badge={{ text: "Sent", variant: "success" }}
      >
        <div>Content</div>
      </CollapsibleResult>,
    );

    expect(screen.getByText("Sent")).toBeTruthy();
  });

  it("expands on click", () => {
    render(
      <CollapsibleResult toolName="gmail_list_messages" summary="Listed 5 emails">
        <div>Email Content Here</div>
      </CollapsibleResult>,
    );

    // Content is in DOM but visually hidden via grid-template-rows: 0fr
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // After click, the grid wrapper should have 1fr
    expect(screen.getByText("Email Content Here")).toBeTruthy();
  });

  it("starts expanded when defaultExpanded is true", () => {
    render(
      <CollapsibleResult toolName="gmail_list_messages" summary="Listed 5 emails" defaultExpanded>
        <div>Expanded Content</div>
      </CollapsibleResult>,
    );

    expect(screen.getByText("Expanded Content")).toBeTruthy();
  });
});

describe("ToolInput", () => {
  it("renders key-value pairs for args", () => {
    render(<ToolInput args={{ maxResults: 5, query: "is:unread" }} />);
    expect(screen.getByText("maxResults")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("query")).toBeTruthy();
    expect(screen.getByText("is:unread")).toBeTruthy();
  });

  it("renders nothing for empty args", () => {
    const { container } = render(<ToolInput args={{}} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for undefined args", () => {
    const { container } = render(<ToolInput args={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("formats booleans with muted styling", () => {
    render(<ToolInput args={{ includeSpam: false }} />);
    expect(screen.getByText("false")).toBeTruthy();
  });

  it("formats simple arrays as comma-joined", () => {
    render(<ToolInput args={{ tags: ["a", "b", "c"] }} />);
    expect(screen.getByText("a, b, c")).toBeTruthy();
  });
});

describe("SupyagentToolAction", () => {
  it("renders collapsed state with summary and status", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "output-available",
      args: { maxResults: 5 },
      result: {
        messages: [
          { id: "1", subject: "Test", from: "test@example.com", snippet: "Hello" },
        ],
      },
    };

    render(<SupyagentToolAction part={part} />);

    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("List messages")).toBeTruthy();
    expect(screen.getByText("Listed 1 emails")).toBeTruthy();
  });

  it("shows streaming state with Calling... badge", () => {
    const part = {
      type: "tool-invocation",
      toolName: "slack_send_message",
      state: "input-streaming",
    };

    render(<SupyagentToolAction part={part} />);

    expect(screen.getByText("Slack")).toBeTruthy();
    expect(screen.getByText("Calling...")).toBeTruthy();
  });

  it("shows error state with Error badge", () => {
    const part = {
      type: "tool-invocation",
      toolName: "compute_run_script",
      state: "output-error",
      args: {},
      result: { error: "Something went wrong" },
    };

    render(<SupyagentToolAction part={part} />);

    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("expands to show formatted input and output", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "output-available",
      args: { maxResults: 5, query: "is:unread" },
      result: {
        messages: [
          { id: "1", subject: "Test Email", from: "test@example.com", snippet: "Hello" },
        ],
      },
    };

    render(<SupyagentToolAction part={part} />);

    // Click to expand
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Input section visible
    expect(screen.getByText("Input")).toBeTruthy();
    expect(screen.getByText("maxResults")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("query")).toBeTruthy();
    expect(screen.getByText("is:unread")).toBeTruthy();

    // Output section visible
    expect(screen.getByText("Output")).toBeTruthy();
  });

  it("shows input-available state with expandable args", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "input-available",
      args: { maxResults: 5 },
    };

    render(<SupyagentToolAction part={part} />);

    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("List messages")).toBeTruthy();

    // Click to expand and see args
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText("maxResults")).toBeTruthy();
  });

  it("renders with defaultExpanded", () => {
    const part = {
      type: "tool-invocation",
      toolName: "gmail_list_messages",
      state: "output-available",
      args: { maxResults: 5 },
      result: {
        messages: [
          { id: "1", subject: "Test", from: "test@example.com", snippet: "Hello" },
        ],
      },
    };

    render(<SupyagentToolAction part={part} defaultExpanded />);

    expect(screen.getByText("Input")).toBeTruthy();
    expect(screen.getByText("Output")).toBeTruthy();
  });

  it("handles v4+ type prefix format", () => {
    const part = {
      type: "tool-gmail_list_messages",
      state: "output-available",
      input: { maxResults: 10 },
      output: {
        messages: [
          { id: "1", subject: "V4 Email", from: "v4@test.com", snippet: "Test" },
        ],
      },
    };

    render(<SupyagentToolAction part={part} />);

    expect(screen.getByText("Gmail")).toBeTruthy();
    expect(screen.getByText("Listed 1 emails")).toBeTruthy();
  });
});
