import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supyagent } from "../src/core/client.js";

describe("accounts client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(data: unknown, status = 200) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ ok: true, data }),
      text: async () => JSON.stringify({ ok: false, error: "fail" }),
    });
  }

  const client = supyagent({ apiKey: "sk_test_123" });

  // ── create ──────────────────────────────────────────────────────────────

  it("accounts.create() sends POST with snake_case body and returns camelCase", async () => {
    mockFetch({
      id: "acc_1",
      external_id: "user_123",
      display_name: "Test User",
      metadata: { plan: "pro" },
      created_at: "2025-01-01T00:00:00Z",
    });

    const account = await client.accounts.create({
      externalId: "user_123",
      displayName: "Test User",
      metadata: { plan: "pro" },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          external_id: "user_123",
          display_name: "Test User",
          metadata: { plan: "pro" },
        }),
      }),
    );

    expect(account).toEqual({
      id: "acc_1",
      externalId: "user_123",
      displayName: "Test User",
      metadata: { plan: "pro" },
      createdAt: "2025-01-01T00:00:00Z",
    });
  });

  // ── list ────────────────────────────────────────────────────────────────

  it("accounts.list() passes limit/offset as query params", async () => {
    mockFetch({
      accounts: [
        {
          id: "acc_1",
          external_id: "user_1",
          display_name: null,
          metadata: {},
          created_at: "2025-01-01T00:00:00Z",
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
    });

    const result = await client.accounts.list({ limit: 10, offset: 0 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts?limit=10&offset=0",
      expect.objectContaining({ method: "GET" }),
    );

    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].externalId).toBe("user_1");
    expect(result.total).toBe(1);
  });

  it("accounts.list() works without options", async () => {
    mockFetch({ accounts: [], total: 0, limit: 20, offset: 0 });

    await client.accounts.list();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts",
      expect.objectContaining({ method: "GET" }),
    );
  });

  // ── get ─────────────────────────────────────────────────────────────────

  it("accounts.get() returns account with integrations", async () => {
    mockFetch({
      id: "acc_1",
      external_id: "user_1",
      display_name: "User 1",
      metadata: {},
      created_at: "2025-01-01T00:00:00Z",
      integrations: [
        {
          id: "int_1",
          provider: "google",
          status: "active",
          connected_at: "2025-01-02T00:00:00Z",
        },
      ],
    });

    const account = await client.accounts.get("acc_1");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1",
      expect.objectContaining({ method: "GET" }),
    );

    expect(account.externalId).toBe("user_1");
    expect(account.integrations).toHaveLength(1);
    expect(account.integrations[0].connectedAt).toBe("2025-01-02T00:00:00Z");
  });

  // ── update ──────────────────────────────────────────────────────────────

  it("accounts.update() sends PATCH with snake_case body", async () => {
    mockFetch({
      id: "acc_1",
      external_id: "user_1",
      display_name: "Updated",
      metadata: {},
      created_at: "2025-01-01T00:00:00Z",
    });

    const account = await client.accounts.update("acc_1", {
      displayName: "Updated",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ display_name: "Updated" }),
      }),
    );

    expect(account.displayName).toBe("Updated");
  });

  // ── delete ──────────────────────────────────────────────────────────────

  it("accounts.delete() returns { deleted: true }", async () => {
    mockFetch({ deleted: true });

    const result = await client.accounts.delete("acc_1");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1",
      expect.objectContaining({ method: "DELETE" }),
    );

    expect(result).toEqual({ deleted: true });
  });

  // ── connect ─────────────────────────────────────────────────────────────

  it("accounts.connect() transforms snake_case response to camelCase", async () => {
    mockFetch({
      connect_url: "https://accounts.google.com/o/oauth2/auth?...",
      session_id: "sess_1",
      expires_at: "2025-01-01T01:00:00Z",
    });

    const session = await client.accounts.connect("acc_1", {
      provider: "google",
      redirectUrl: "https://myapp.com/callback",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1/connect",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          provider: "google",
          redirect_url: "https://myapp.com/callback",
        }),
      }),
    );

    expect(session).toEqual({
      connectUrl: "https://accounts.google.com/o/oauth2/auth?...",
      sessionId: "sess_1",
      expiresAt: "2025-01-01T01:00:00Z",
    });
  });

  it("accounts.connect() includes scopes when provided", async () => {
    mockFetch({
      connect_url: "https://example.com/auth",
      session_id: "sess_2",
      expires_at: "2025-01-01T01:00:00Z",
    });

    await client.accounts.connect("acc_1", {
      provider: "google",
      redirectUrl: "https://myapp.com/callback",
      scopes: ["gmail.read", "calendar.read"],
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1/connect",
      expect.objectContaining({
        body: JSON.stringify({
          provider: "google",
          redirect_url: "https://myapp.com/callback",
          scopes: ["gmail.read", "calendar.read"],
        }),
      }),
    );
  });

  // ── getSession ──────────────────────────────────────────────────────────

  it("accounts.getSession() transforms session status response", async () => {
    mockFetch({
      session_id: "sess_1",
      provider: "google",
      status: "completed",
      created_at: "2025-01-01T00:00:00Z",
      expires_at: "2025-01-01T01:00:00Z",
    });

    const session = await client.accounts.getSession("acc_1", "sess_1");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1/connect/sess_1",
      expect.objectContaining({ method: "GET" }),
    );

    expect(session).toEqual({
      sessionId: "sess_1",
      provider: "google",
      status: "completed",
      createdAt: "2025-01-01T00:00:00Z",
      expiresAt: "2025-01-01T01:00:00Z",
    });
  });

  it("accounts.getSession() includes error field when present", async () => {
    mockFetch({
      session_id: "sess_1",
      provider: "google",
      status: "failed",
      error: "access_denied",
      created_at: "2025-01-01T00:00:00Z",
      expires_at: "2025-01-01T01:00:00Z",
    });

    const session = await client.accounts.getSession("acc_1", "sess_1");
    expect(session.error).toBe("access_denied");
  });

  // ── integrations ────────────────────────────────────────────────────────

  it("accounts.integrations() returns detailed integrations", async () => {
    mockFetch({
      integrations: [
        {
          id: "int_1",
          provider: "google",
          status: "active",
          connected_at: "2025-01-02T00:00:00Z",
          enabled_services: [
            { service_name: "gmail", is_enabled: true },
            { service_name: "calendar", is_enabled: false },
          ],
        },
      ],
    });

    const integrations = await client.accounts.integrations("acc_1");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1/integrations",
      expect.objectContaining({ method: "GET" }),
    );

    expect(integrations).toHaveLength(1);
    expect(integrations[0].connectedAt).toBe("2025-01-02T00:00:00Z");
    expect(integrations[0].enabledServices).toEqual([
      { serviceName: "gmail", isEnabled: true },
      { serviceName: "calendar", isEnabled: false },
    ]);
  });

  // ── disconnect ──────────────────────────────────────────────────────────

  it("accounts.disconnect() DELETEs the correct path", async () => {
    mockFetch({ deleted: true, provider: "slack" });

    const result = await client.accounts.disconnect("acc_1", "slack");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://app.supyagent.com/api/v1/accounts/acc_1/integrations/slack",
      expect.objectContaining({ method: "DELETE" }),
    );

    expect(result).toEqual({ deleted: true, provider: "slack" });
  });

  // ── error handling ──────────────────────────────────────────────────────

  it("throws on non-ok responses", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '{"ok":false,"error":"Connected account not found"}',
    });

    await expect(client.accounts.get("nonexistent")).rejects.toThrow(
      "Supyagent API error (404)",
    );
  });
});
