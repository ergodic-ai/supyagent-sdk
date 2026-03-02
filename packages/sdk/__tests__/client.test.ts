import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supyagent } from "../src/core/client.js";
import type { ToolsResponse, ScopedClient, SupyagentClient, ToolSearchResponse, ToolListResponse } from "../src/core/types.js";

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

  it("unwraps data envelope from API response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: MOCK_RESPONSE }),
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const tools = await client.tools();

    expect(Object.keys(tools)).toEqual(["gmail_list_messages", "slack_send_message"]);
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

describe("asAccount()", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns a ScopedClient with tools/skills/me", () => {
    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123");

    expect(typeof scoped.tools).toBe("function");
    expect(typeof scoped.skills).toBe("function");
    expect(typeof scoped.me).toBe("function");
  });

  it("accountId returns the external ID", () => {
    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_456");

    expect(scoped.accountId).toBe("user_456");
  });

  it("does not have accounts property", () => {
    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123") as unknown as Record<string, unknown>;

    expect(scoped.accounts).toBeUndefined();
  });

  it("does not have asAccount property", () => {
    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123") as unknown as Record<string, unknown>;

    expect(scoped.asAccount).toBeUndefined();
  });

  it("sends X-Account-Id header on tools() fetch", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123");
    await scoped.tools();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_123",
        }),
      })
    );
  });

  it("sends X-Account-Id header on skills() fetch", async () => {
    const MOCK_SKILLS = `---\nname: Test\ndescription: Test skills\n---\nPreamble\n---\n# Gmail\nGmail docs`;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => MOCK_SKILLS,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123");
    await scoped.skills();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/skills",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_123",
        }),
      })
    );
  });

  it("sends X-Account-Id header on me() fetch", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        email: "user@test.com",
        tier: "pro",
        usage: { current: 10, limit: 1000 },
        integrations: [],
        dashboardUrl: "https://app.supyagent.com",
      }),
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123");
    await scoped.me();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_123",
        }),
      })
    );
  });

  it("has separate cache from parent client", async () => {
    let callCount = 0;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => MOCK_RESPONSE,
      };
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_123");

    // Fetch on parent (cached)
    await client.tools({ cache: 300 });
    // Fetch on scoped (should NOT use parent's cache)
    await scoped.tools({ cache: 300 });

    // Both should have made separate fetch calls
    expect(callCount).toBe(2);
  });
});

describe("searchTools()", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const MOCK_SEARCH_RESPONSE: { ok: true; data: ToolSearchResponse } = {
    ok: true,
    data: {
      tools: [
        {
          ...MOCK_RESPONSE.tools[0],
          metadata: { ...MOCK_RESPONSE.tools[0].metadata, connected: true },
          score: 0.8,
        },
        {
          ...MOCK_RESPONSE.tools[1],
          metadata: { ...MOCK_RESPONSE.tools[1].metadata, connected: false },
          score: 0.4,
        },
      ],
      total: 2,
    },
  };

  it("calls the search endpoint with encoded query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SEARCH_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const result = await client.searchTools("send email");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools/search/send%20email",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_123",
        }),
      })
    );

    expect(result.tools).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.tools[0].score).toBe(0.8);
    expect(result.tools[0].metadata.connected).toBe(true);
    expect(result.tools[1].score).toBe(0.4);
    expect(result.tools[1].metadata.connected).toBe(false);
  });

  it("returns empty array when no matches", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: { tools: [], total: 0 } }),
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const result = await client.searchTools("nonexistent");

    expect(result.tools).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("works on scoped client with X-Account-Id header", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SEARCH_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const scoped = client.asAccount("user_456");
    await scoped.searchTools("calendar");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools/search/calendar",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_456",
        }),
      })
    );
  });
});

describe("toolsByProvider()", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const MOCK_LIST_RESPONSE: { ok: true; data: ToolListResponse } = {
    ok: true,
    data: {
      tools: [
        {
          ...MOCK_RESPONSE.tools[0],
          metadata: { ...MOCK_RESPONSE.tools[0].metadata, connected: true },
        },
      ],
      total: 1,
    },
  };

  it("calls the provider endpoint", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_LIST_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const result = await client.toolsByProvider("google");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools/provider/google",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_123",
        }),
      })
    );

    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].metadata.connected).toBe(true);
    expect(result.total).toBe(1);
  });

  it("works on scoped client", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_LIST_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    await client.asAccount("user_789").toolsByProvider("slack");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools/provider/slack",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_789",
        }),
      })
    );
  });
});

describe("toolsByService()", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const MOCK_LIST_RESPONSE: { ok: true; data: ToolListResponse } = {
    ok: true,
    data: {
      tools: [
        {
          ...MOCK_RESPONSE.tools[0],
          metadata: { ...MOCK_RESPONSE.tools[0].metadata, connected: true },
        },
      ],
      total: 1,
    },
  };

  it("calls the service endpoint", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_LIST_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    const result = await client.toolsByService("gmail");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools/service/gmail",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_123",
        }),
      })
    );

    expect(result.tools).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("works on scoped client", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => MOCK_LIST_RESPONSE,
    });

    const client = supyagent({ apiKey: "sk_test_123" });
    await client.asAccount("user_abc").toolsByService("calendar");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/tools/service/calendar",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_abc",
        }),
      })
    );
  });
});
