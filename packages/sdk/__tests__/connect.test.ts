import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { openConnectPopup } from "../src/connect/popup.js";
import { handleConnectCallback } from "../src/connect/callback.js";

describe("openConnectPopup", () => {
  const originalOpen = window.open;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  let messageHandler: ((event: MessageEvent) => void) | null = null;
  let mockPopup: { closed: boolean; close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPopup = { closed: false, close: vi.fn() };
    messageHandler = null;

    window.open = vi.fn().mockReturnValue(mockPopup);
    window.addEventListener = vi.fn((event, handler) => {
      if (event === "message") messageHandler = handler as typeof messageHandler;
    });
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    vi.restoreAllMocks();
  });

  it("calls window.open with correct features", () => {
    // Don't await — we just check the open call
    const promise = openConnectPopup({ connectUrl: "https://example.com/auth" });

    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/auth",
      "supyagent_connect",
      expect.stringContaining("width=500"),
    );
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/auth",
      "supyagent_connect",
      expect.stringContaining("height=700"),
    );

    // Clean up: simulate close so the promise settles
    mockPopup.closed = true;
    promise.catch(() => {});
  });

  it("uses custom width and height", () => {
    const promise = openConnectPopup({
      connectUrl: "https://example.com/auth",
      width: 600,
      height: 800,
    });

    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/auth",
      "supyagent_connect",
      expect.stringContaining("width=600"),
    );

    mockPopup.closed = true;
    promise.catch(() => {});
  });

  it("rejects when popup is blocked (returns null)", async () => {
    (window.open as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(
      openConnectPopup({ connectUrl: "https://example.com/auth" }),
    ).rejects.toThrow("Popup was blocked");
  });

  it("resolves on success postMessage", async () => {
    const promise = openConnectPopup({ connectUrl: "https://example.com/auth" });

    // Simulate the postMessage from the redirect page
    messageHandler!({
      data: {
        type: "supyagent:connect",
        status: "success",
        provider: "google",
        accountId: "ext_123",
      },
    } as MessageEvent);

    const result = await promise;
    expect(result).toEqual({
      status: "success",
      provider: "google",
      accountId: "ext_123",
    });
    expect(mockPopup.close).toHaveBeenCalled();
  });

  it("calls onSuccess callback on success", async () => {
    const onSuccess = vi.fn();
    const promise = openConnectPopup({
      connectUrl: "https://example.com/auth",
      onSuccess,
    });

    messageHandler!({
      data: {
        type: "supyagent:connect",
        status: "success",
        provider: "slack",
        accountId: "ext_456",
      },
    } as MessageEvent);

    await promise;
    expect(onSuccess).toHaveBeenCalledWith({
      status: "success",
      provider: "slack",
      accountId: "ext_456",
    });
  });

  it("rejects on error postMessage", async () => {
    const promise = openConnectPopup({ connectUrl: "https://example.com/auth" });

    messageHandler!({
      data: {
        type: "supyagent:connect",
        status: "error",
        error: "access_denied",
      },
    } as MessageEvent);

    await expect(promise).rejects.toThrow("access_denied");
    expect(mockPopup.close).toHaveBeenCalled();
  });

  it("calls onError callback on error postMessage", async () => {
    const onError = vi.fn();
    const promise = openConnectPopup({
      connectUrl: "https://example.com/auth",
      onError,
    });

    messageHandler!({
      data: {
        type: "supyagent:connect",
        status: "error",
        error: "token_exchange_failed",
      },
    } as MessageEvent);

    await promise.catch(() => {});
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "token_exchange_failed" }));
  });

  it("ignores unrelated postMessage events", () => {
    const promise = openConnectPopup({ connectUrl: "https://example.com/auth" });

    // This should be ignored (wrong type)
    messageHandler!({
      data: { type: "unrelated", foo: "bar" },
    } as MessageEvent);

    // This should be ignored (no data)
    messageHandler!({ data: undefined } as MessageEvent);

    // The promise should still be pending — clean up
    mockPopup.closed = true;
    promise.catch(() => {});
  });

  it("rejects when popup is closed before completion", async () => {
    vi.useFakeTimers();

    const promise = openConnectPopup({ connectUrl: "https://example.com/auth" });

    // Simulate user closing the popup
    mockPopup.closed = true;
    vi.advanceTimersByTime(500);

    await expect(promise).rejects.toThrow("Popup was closed before completing");

    vi.useRealTimers();
  });

  it("cleans up event listeners on success", async () => {
    const promise = openConnectPopup({ connectUrl: "https://example.com/auth" });

    messageHandler!({
      data: {
        type: "supyagent:connect",
        status: "success",
        provider: "google",
        accountId: "ext_1",
      },
    } as MessageEvent);

    await promise;
    expect(window.removeEventListener).toHaveBeenCalledWith("message", expect.any(Function));
  });
});

describe("handleConnectCallback", () => {
  const originalOpener = window.opener;
  const originalClose = window.close;
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;

    // Mock window.opener
    Object.defineProperty(window, "opener", {
      value: { postMessage: vi.fn() },
      writable: true,
      configurable: true,
    });
    window.close = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, "opener", {
      value: originalOpener,
      writable: true,
      configurable: true,
    });
    window.close = originalClose;
  });

  function setSearchParams(params: string) {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: params },
      writable: true,
      configurable: true,
    });
  }

  it("reads success params and posts correct message", () => {
    setSearchParams("?status=success&provider=google&account_id=ext_123");

    handleConnectCallback();

    expect(window.opener!.postMessage).toHaveBeenCalledWith(
      {
        type: "supyagent:connect",
        status: "success",
        provider: "google",
        accountId: "ext_123",
      },
      "*",
    );
  });

  it("reads error params and posts error message", () => {
    setSearchParams("?error=access_denied");

    handleConnectCallback();

    expect(window.opener!.postMessage).toHaveBeenCalledWith(
      {
        type: "supyagent:connect",
        status: "error",
        error: "access_denied",
      },
      "*",
    );
  });

  it("auto-closes the window by default", () => {
    setSearchParams("?status=success&provider=google&account_id=ext_1");

    handleConnectCallback();

    expect(window.close).toHaveBeenCalled();
  });

  it("does not auto-close when autoClose is false", () => {
    setSearchParams("?status=success&provider=google&account_id=ext_1");

    handleConnectCallback({ autoClose: false });

    expect(window.close).not.toHaveBeenCalled();
  });

  it("uses custom targetOrigin", () => {
    setSearchParams("?status=success&provider=slack&account_id=ext_2");

    handleConnectCallback({ targetOrigin: "https://myapp.com" });

    expect(window.opener!.postMessage).toHaveBeenCalledWith(
      expect.anything(),
      "https://myapp.com",
    );
  });

  it("handles missing opener gracefully", () => {
    Object.defineProperty(window, "opener", {
      value: null,
      writable: true,
      configurable: true,
    });
    setSearchParams("?status=success&provider=google&account_id=ext_1");

    // Should not throw
    expect(() => handleConnectCallback()).not.toThrow();
  });
});
