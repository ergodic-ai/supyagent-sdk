import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TTLCache } from "../src/core/cache.js";

describe("TTLCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined for missing keys", () => {
    const cache = new TTLCache<string>();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves values", () => {
    const cache = new TTLCache<string>();
    cache.set("key", "value", 60);
    expect(cache.get("key")).toBe("value");
  });

  it("expires entries after TTL", () => {
    const cache = new TTLCache<string>();
    cache.set("key", "value", 10);

    expect(cache.get("key")).toBe("value");

    vi.advanceTimersByTime(11_000);

    expect(cache.get("key")).toBeUndefined();
  });

  it("does not expire entries before TTL", () => {
    const cache = new TTLCache<string>();
    cache.set("key", "value", 10);

    vi.advanceTimersByTime(9_000);
    expect(cache.get("key")).toBe("value");
  });

  it("clears all entries", () => {
    const cache = new TTLCache<string>();
    cache.set("a", "1", 60);
    cache.set("b", "2", 60);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });
});
