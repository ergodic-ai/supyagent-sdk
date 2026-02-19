import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supyagent } from "../src/core/client.js";
import type { ToolsResponse } from "../src/core/types.js";

const MOCK_RESPONSE: ToolsResponse = {
  tools: [
    {
      type: "function",
      function: {
        name: "gmail_list_messages",
        description: "List emails from Gmail inbox",
        parameters: {
          type: "object",
          properties: {
            maxResults: { type: "integer", description: "Number of messages" },
          },
        },
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
        name: "slack_send_message",
        description: "Send Slack message",
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string", description: "Channel ID" },
            text: { type: "string", description: "Message text" },
          },
          required: ["channel", "text"],
        },
      },
      metadata: {
        provider: "slack",
        service: "slack",
        permission: "slack.write",
        method: "POST",
        path: "/api/v1/slack/messages",
      },
    },
  ],
  base_url: "https://app.supyagent.com",
  total: 2,
};

describe("supyagent client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches tools and converts to AI SDK format", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const tools = await client.tools();

    // Should have called fetch with the right URL
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_123",
        }),
      })
    );

    // Should return tool objects
    expect(Object.keys(tools)).toEqual(["gmail_list_messages", "slack_send_message"]);
  });

  it("uses custom baseUrl", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({
      apiKey: "sk_test_123",
      baseUrl: "https://custom.example.com",
    });
    await client.tools();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://custom.example.com/api/v1/tools",
      expect.anything()
    );
  });

  it("applies only filter", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const tools = await client.tools({ only: ["gmail"] });

    expect(Object.keys(tools)).toEqual(["gmail_list_messages"]);
  });

  it("applies except filter", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const tools = await client.tools({ except: ["slack"] });

    expect(Object.keys(tools)).toEqual(["gmail_list_messages"]);
  });

  it("caches with cache: true (60s)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });

    await client.tools({ cache: true });
    await client.tools({ cache: true });

    // Should only fetch once
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("caches with numeric TTL", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });

    await client.tools({ cache: 300 });
    await client.tools({ cache: 300 });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not cache by default", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });

    await client.tools();
    await client.tools();

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws on API error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":"Invalid API key"}',
    });

    const client = supyagent({ apiKey: "bad_key" });

    await expect(client.tools()).rejects.toThrow("Supyagent API error (401)");
  });

  it("returns empty object when no tools", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ tools: [], base_url: "https://app.supyagent.com", total: 0 }),
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const tools = await client.tools();

    expect(tools).toEqual({});
  });
});
