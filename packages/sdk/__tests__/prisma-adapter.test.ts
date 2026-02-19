import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPrismaAdapter } from "../src/persistence/prisma-adapter.js";

function createMockPrisma() {
  return {
    chat: {
      upsert: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue({}),
    },
    message: {
      count: vi.fn().mockResolvedValue(0),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

describe("createPrismaAdapter", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let adapter: ReturnType<typeof createPrismaAdapter>;

  beforeEach(() => {
    prisma = createMockPrisma();
    adapter = createPrismaAdapter(prisma);
  });

  describe("saveChat", () => {
    it("upserts the chat and creates new messages", async () => {
      const messages = [
        { id: "msg_1", role: "user", parts: [{ type: "text", text: "Hello world" }] },
        { id: "msg_2", role: "assistant", parts: [{ type: "text", text: "Hi!" }] },
      ];

      await adapter.saveChat("chat_1", messages);

      // Should upsert chat with title from first user message
      expect(prisma.chat.upsert).toHaveBeenCalledWith({
        where: { id: "chat_1" },
        create: { id: "chat_1", title: "Hello world" },
        update: { title: "Hello world" },
      });

      // Should count existing messages
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: { chatId: "chat_1" },
      });

      // Should create all messages (0 existing)
      expect(prisma.message.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: "msg_1",
            chatId: "chat_1",
            role: "user",
            parts: JSON.stringify([{ type: "text", text: "Hello world" }]),
            metadata: null,
          },
          {
            id: "msg_2",
            chatId: "chat_1",
            role: "assistant",
            parts: JSON.stringify([{ type: "text", text: "Hi!" }]),
            metadata: null,
          },
        ],
      });
    });

    it("only appends new messages (append-only diff)", async () => {
      prisma.message.count.mockResolvedValue(2);

      const messages = [
        { id: "msg_1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        { id: "msg_2", role: "assistant", parts: [{ type: "text", text: "Hi" }] },
        { id: "msg_3", role: "user", parts: [{ type: "text", text: "How are you?" }] },
      ];

      await adapter.saveChat("chat_1", messages);

      // Should only create the 3rd message
      expect(prisma.message.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: "msg_3",
            chatId: "chat_1",
            role: "user",
            parts: JSON.stringify([{ type: "text", text: "How are you?" }]),
            metadata: null,
          },
        ],
      });
    });

    it("skips createMany when no new messages", async () => {
      prisma.message.count.mockResolvedValue(2);

      const messages = [
        { id: "msg_1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        { id: "msg_2", role: "assistant", parts: [{ type: "text", text: "Hi" }] },
      ];

      await adapter.saveChat("chat_1", messages);

      expect(prisma.message.createMany).not.toHaveBeenCalled();
    });

    it("uses 'New Chat' as title when no user message", async () => {
      const messages = [
        { id: "msg_1", role: "system", parts: [{ type: "text", text: "You are helpful" }] },
      ];

      await adapter.saveChat("chat_1", messages);

      expect(prisma.chat.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ title: "New Chat" }),
        })
      );
    });

    it("truncates title to 100 chars", async () => {
      const longText = "A".repeat(200);
      const messages = [
        { id: "msg_1", role: "user", parts: [{ type: "text", text: longText }] },
      ];

      await adapter.saveChat("chat_1", messages);

      const createArg = prisma.chat.upsert.mock.calls[0][0].create;
      expect(createArg.title).toHaveLength(100);
    });

    it("serializes metadata", async () => {
      const messages = [
        {
          id: "msg_1",
          role: "assistant",
          parts: [{ type: "text", text: "Hi" }],
          metadata: { model: "claude-sonnet-4-20250514" },
        },
      ];

      await adapter.saveChat("chat_1", messages);

      const createData = prisma.message.createMany.mock.calls[0][0].data[0];
      expect(createData.metadata).toBe(JSON.stringify({ model: "claude-sonnet-4-20250514" }));
    });
  });

  describe("loadChat", () => {
    it("loads and deserializes messages", async () => {
      prisma.message.findMany.mockResolvedValue([
        {
          id: "msg_1",
          role: "user",
          parts: JSON.stringify([{ type: "text", text: "Hello" }]),
          metadata: null,
        },
        {
          id: "msg_2",
          role: "assistant",
          parts: JSON.stringify([{ type: "text", text: "Hi!" }]),
          metadata: JSON.stringify({ model: "claude" }),
        },
      ]);

      const messages = await adapter.loadChat("chat_1");

      expect(messages).toEqual([
        { id: "msg_1", role: "user", parts: [{ type: "text", text: "Hello" }], metadata: undefined },
        { id: "msg_2", role: "assistant", parts: [{ type: "text", text: "Hi!" }], metadata: { model: "claude" } },
      ]);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: "chat_1" },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("listChats", () => {
    it("returns chat summaries ordered by updatedAt desc", async () => {
      const chats = [
        { id: "chat_1", title: "Hello", createdAt: new Date(), updatedAt: new Date() },
      ];
      prisma.chat.findMany.mockResolvedValue(chats);

      const result = await adapter.listChats();
      expect(result).toEqual(chats);
      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      });
    });
  });

  describe("deleteChat", () => {
    it("deletes the chat (cascade removes messages)", async () => {
      await adapter.deleteChat("chat_1");
      expect(prisma.chat.delete).toHaveBeenCalledWith({ where: { id: "chat_1" } });
    });
  });
});
