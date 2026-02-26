import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createExecutor } from "../src/core/http-executor.js";
import type { ToolMetadata } from "../src/core/types.js";

describe("createExecutor", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("makes GET request with query params", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "gmail",
      permission: "gmail.read",
      method: "GET",
      path: "/api/v1/gmail/messages",
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ messages: [] }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123");
    const result = await execute({ maxResults: 5, q: "from:boss" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/gmail/messages?maxResults=5&q=from%3Aboss",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_123",
        }),
      })
    );
    expect(result).toEqual({ messages: [] });
  });

  it("substitutes path parameters", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "gmail",
      permission: "gmail.read",
      method: "GET",
      path: "/api/v1/gmail/messages/{messageId}",
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ id: "msg_123", subject: "Test" }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123");
    await execute({ messageId: "msg_123" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/gmail/messages/msg_123",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("makes POST request with body and bodyDefaults", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "gmail",
      permission: "gmail.send",
      method: "POST",
      path: "/api/v1/gmail/send",
      bodyDefaults: { isHtml: "false" },
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ ok: true }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123");
    await execute({ to: "user@example.com", subject: "Hi", body: "Hello" });

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("https://app.supyagent.com/api/v1/gmail/send");
    expect(call[1].method).toBe("POST");
    expect(JSON.parse(call[1].body)).toEqual({
      isHtml: "false",
      to: "user@example.com",
      subject: "Hi",
      body: "Hello",
    });
  });

  it("handles DELETE with remaining args as query params", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "calendar",
      permission: "calendar.write",
      method: "DELETE",
      path: "/api/v1/calendar/events/{eventId}",
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ ok: true }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123");
    await execute({ eventId: "evt_123", calendarId: "primary" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/calendar/events/evt_123?calendarId=primary",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("skips undefined and null values in query params", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "gmail",
      permission: "gmail.read",
      method: "GET",
      path: "/api/v1/gmail/messages",
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ messages: [] }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123");
    await execute({ maxResults: 5, q: undefined, pageToken: null });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/gmail/messages?maxResults=5",
      expect.anything()
    );
  });

  it("sends X-Account-Id header when accountId is provided", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "gmail",
      permission: "gmail.read",
      method: "GET",
      path: "/api/v1/gmail/messages",
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ messages: [] }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123", "user_456");
    await execute({ maxResults: 5 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/gmail/messages?maxResults=5",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Account-Id": "user_456",
        }),
      })
    );
  });

  it("does not send X-Account-Id when accountId is undefined", async () => {
    const metadata: ToolMetadata = {
      provider: "google",
      service: "gmail",
      permission: "gmail.read",
      method: "GET",
      path: "/api/v1/gmail/messages",
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ messages: [] }),
    });

    const execute = createExecutor(metadata, "https://app.supyagent.com", "sk_test_123");
    await execute({});

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers as Record<string, string>;
    expect(headers["X-Account-Id"]).toBeUndefined();
  });
});
