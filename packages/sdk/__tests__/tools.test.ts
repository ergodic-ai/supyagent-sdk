import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createEditFileTool } from "../src/tools/edit-file.js";
import { createGrepTool } from "../src/tools/grep.js";
import { createFindTool } from "../src/tools/find.js";
import { createReadFileRangeTool } from "../src/tools/read-file-range.js";
import { createAppendFileTool } from "../src/tools/append-file.js";
import { createHttpRequestTool } from "../src/tools/http-request.js";

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `sdk-tools-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── editFile ────────────────────────────────────────────────────────────────

describe("createEditFileTool", () => {
  it("applies a single edit", async () => {
    await writeFile(join(testDir, "hello.txt"), "Hello world\nGoodbye world\n");
    const tool = createEditFileTool({ cwd: testDir });

    const result = await tool.execute(
      { path: "hello.txt", edits: [{ oldText: "Hello", newText: "Hi" }] },
      { toolCallId: "t1", messages: [], abortSignal: undefined as unknown as AbortSignal },
    );

    expect(result).toEqual({ path: "hello.txt", replacements: 1 });
    const content = await readFile(join(testDir, "hello.txt"), "utf-8");
    expect(content).toBe("Hi world\nGoodbye world\n");
  });

  it("applies multiple edits sequentially", async () => {
    await writeFile(join(testDir, "multi.txt"), "aaa bbb ccc");
    const tool = createEditFileTool({ cwd: testDir });

    const result = await tool.execute(
      {
        path: "multi.txt",
        edits: [
          { oldText: "aaa", newText: "AAA" },
          { oldText: "ccc", newText: "CCC" },
        ],
      },
      { toolCallId: "t2", messages: [], abortSignal: undefined as unknown as AbortSignal },
    );

    expect(result).toEqual({ path: "multi.txt", replacements: 2 });
    const content = await readFile(join(testDir, "multi.txt"), "utf-8");
    expect(content).toBe("AAA bbb CCC");
  });

  it("returns error with current content when oldText not found", async () => {
    await writeFile(join(testDir, "nope.txt"), "actual content");
    const tool = createEditFileTool({ cwd: testDir });

    const result = (await tool.execute(
      { path: "nope.txt", edits: [{ oldText: "missing", newText: "x" }] },
      { toolCallId: "t3", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { error: string; currentContent: string };

    expect(result.error).toContain("oldText not found");
    expect(result.currentContent).toBe("actual content");
  });

  it("returns error for missing file", async () => {
    const tool = createEditFileTool({ cwd: testDir });

    const result = (await tool.execute(
      { path: "ghost.txt", edits: [{ oldText: "a", newText: "b" }] },
      { toolCallId: "t4", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { error: string };

    expect(result.error).toContain("File not found");
  });
});

// ── grep ────────────────────────────────────────────────────────────────────

describe("createGrepTool", () => {
  it("finds matching lines", async () => {
    await writeFile(join(testDir, "code.ts"), "const foo = 1;\nconst bar = 2;\nconst fooBar = 3;\n");
    const tool = createGrepTool({ cwd: testDir });

    const result = (await tool.execute(
      { pattern: "foo", path: "." },
      { toolCallId: "t5", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { matches: string; matchCount: number };

    expect(result.matchCount).toBeGreaterThanOrEqual(2);
    expect(result.matches).toContain("foo");
  });

  it("returns empty when no matches", async () => {
    await writeFile(join(testDir, "empty.txt"), "nothing here");
    const tool = createGrepTool({ cwd: testDir });

    const result = (await tool.execute(
      { pattern: "zzzznotfound", path: "." },
      { toolCallId: "t6", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { matchCount: number };

    expect(result.matchCount).toBe(0);
  });

  it("supports case-insensitive search", async () => {
    await writeFile(join(testDir, "case.txt"), "Hello World\nhello world\n");
    const tool = createGrepTool({ cwd: testDir });

    const result = (await tool.execute(
      { pattern: "HELLO", path: ".", ignoreCase: true },
      { toolCallId: "t7", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { matchCount: number };

    expect(result.matchCount).toBe(2);
  });
});

// ── find ────────────────────────────────────────────────────────────────────

describe("createFindTool", () => {
  it("finds files by pattern", async () => {
    await writeFile(join(testDir, "app.ts"), "");
    await writeFile(join(testDir, "app.test.ts"), "");
    await writeFile(join(testDir, "readme.md"), "");
    const tool = createFindTool({ cwd: testDir });

    const result = (await tool.execute(
      { pattern: "*.ts" },
      { toolCallId: "t8", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { files: string[]; count: number };

    expect(result.count).toBe(2);
    expect(result.files.some((f: string) => f.includes("app.ts"))).toBe(true);
    expect(result.files.some((f: string) => f.includes("app.test.ts"))).toBe(true);
  });

  it("returns empty array when no matches", async () => {
    const tool = createFindTool({ cwd: testDir });

    const result = (await tool.execute(
      { pattern: "*.xyz" },
      { toolCallId: "t9", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { files: string[]; count: number };

    expect(result.count).toBe(0);
    expect(result.files).toEqual([]);
  });

  it("ignores node_modules", async () => {
    await mkdir(join(testDir, "node_modules"), { recursive: true });
    await writeFile(join(testDir, "node_modules", "dep.ts"), "");
    await writeFile(join(testDir, "src.ts"), "");
    const tool = createFindTool({ cwd: testDir });

    const result = (await tool.execute(
      { pattern: "*.ts" },
      { toolCallId: "t10", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { files: string[] };

    expect(result.files.some((f: string) => f.includes("node_modules"))).toBe(false);
    expect(result.files.some((f: string) => f.includes("src.ts"))).toBe(true);
  });
});

// ── readFileRange ───────────────────────────────────────────────────────────

describe("createReadFileRangeTool", () => {
  it("reads a specific line range", async () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join("\n");
    await writeFile(join(testDir, "big.txt"), lines);
    const tool = createReadFileRangeTool({ cwd: testDir });

    const result = (await tool.execute(
      { path: "big.txt", startLine: 10, endLine: 15 },
      { toolCallId: "t11", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { content: string; startLine: number; endLine: number; totalLines: number };

    expect(result.startLine).toBe(10);
    expect(result.endLine).toBe(15);
    expect(result.content).toContain("10\tLine 10");
    expect(result.content).toContain("15\tLine 15");
    expect(result.content).not.toContain("16\t");
  });

  it("reads from the beginning by default", async () => {
    await writeFile(join(testDir, "short.txt"), "one\ntwo\nthree\n");
    const tool = createReadFileRangeTool({ cwd: testDir });

    const result = (await tool.execute(
      { path: "short.txt" },
      { toolCallId: "t12", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { startLine: number; totalLines: number };

    expect(result.startLine).toBe(1);
    expect(result.totalLines).toBe(3);
  });

  it("returns error for missing file", async () => {
    const tool = createReadFileRangeTool({ cwd: testDir });

    const result = (await tool.execute(
      { path: "nope.txt" },
      { toolCallId: "t13", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { error: string };

    expect(result.error).toContain("File not found");
  });
});

// ── appendFile ──────────────────────────────────────────────────────────────

describe("createAppendFileTool", () => {
  it("appends to existing file", async () => {
    await writeFile(join(testDir, "log.txt"), "line 1\n");
    const tool = createAppendFileTool({ cwd: testDir });

    const result = (await tool.execute(
      { path: "log.txt", content: "line 2\n" },
      { toolCallId: "t14", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { path: string; bytesAppended: number };

    expect(result.bytesAppended).toBe(7);
    const content = await readFile(join(testDir, "log.txt"), "utf-8");
    expect(content).toBe("line 1\nline 2\n");
  });

  it("creates file if it doesn't exist", async () => {
    const tool = createAppendFileTool({ cwd: testDir });

    await tool.execute(
      { path: "new.txt", content: "first line\n" },
      { toolCallId: "t15", messages: [], abortSignal: undefined as unknown as AbortSignal },
    );

    const content = await readFile(join(testDir, "new.txt"), "utf-8");
    expect(content).toBe("first line\n");
  });
});

// ── httpRequest ─────────────────────────────────────────────────────────────

describe("createHttpRequestTool", () => {
  it("makes a GET request", async () => {
    const tool = createHttpRequestTool({ timeout: 10_000 });

    const result = (await tool.execute(
      { url: "https://httpbin.org/get", method: "GET" },
      { toolCallId: "t16", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { status: number; body: string; durationMs: number };

    expect(result.status).toBe(200);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.body).toContain("httpbin.org");
  });

  it("makes a POST request with body", async () => {
    const tool = createHttpRequestTool({ timeout: 10_000 });

    const result = (await tool.execute(
      {
        url: "https://httpbin.org/post",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hello: "world" }),
      },
      { toolCallId: "t17", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { status: number; body: string };

    expect(result.status).toBe(200);
    expect(result.body).toContain("hello");
  });

  it("returns error for invalid URL", async () => {
    const tool = createHttpRequestTool({ timeout: 5000 });

    const result = (await tool.execute(
      { url: "http://localhost:1" },
      { toolCallId: "t18", messages: [], abortSignal: undefined as unknown as AbortSignal },
    )) as { error: string };

    expect(result.error).toContain("Request failed");
  });
});
