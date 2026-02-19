import type { ChatAdapter, ChatSummary, UIMessageLike } from "./types.js";

/**
 * Minimal PrismaClient interface — just the methods we use.
 * Avoids importing @prisma/client at the type level.
 */
interface PrismaLike {
  chat: {
    upsert: (args: {
      where: { id: string };
      create: { id: string; title: string };
      update: { title?: string };
    }) => Promise<unknown>;
    findMany: (args: {
      orderBy: { updatedAt: string };
      select: { id: boolean; title: boolean; createdAt: boolean; updatedAt: boolean };
    }) => Promise<ChatSummary[]>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  message: {
    count: (args: { where: { chatId: string } }) => Promise<number>;
    createMany: (args: {
      data: Array<{
        id: string;
        chatId: string;
        role: string;
        parts: string;
        metadata: string | null;
      }>;
    }) => Promise<unknown>;
    findMany: (args: {
      where: { chatId: string };
      orderBy: { createdAt: string };
    }) => Promise<Array<{
      id: string;
      role: string;
      parts: string;
      metadata: string | null;
    }>>;
  };
}

/**
 * Create a ChatAdapter backed by Prisma.
 *
 * @example
 * ```ts
 * import { createPrismaAdapter } from '@supyagent/sdk/prisma';
 * import { prisma } from '@/lib/prisma';
 *
 * const adapter = createPrismaAdapter(prisma);
 * ```
 */
export function createPrismaAdapter(prisma: PrismaLike): ChatAdapter {
  return {
    async saveChat(chatId: string, messages: UIMessageLike[]) {
      // Extract title from first user message
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = extractTitle(firstUserMsg);

      // Upsert the chat record
      await prisma.chat.upsert({
        where: { id: chatId },
        create: { id: chatId, title },
        update: { title },
      });

      // Append-only: count existing messages, create only new ones
      const existingCount = await prisma.message.count({
        where: { chatId },
      });

      const newMessages = messages.slice(existingCount);
      if (newMessages.length > 0) {
        await prisma.message.createMany({
          data: newMessages.map((msg) => ({
            id: msg.id,
            chatId,
            role: msg.role,
            parts: JSON.stringify(msg.parts),
            metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
          })),
        });
      }
    },

    async loadChat(chatId: string) {
      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
      });

      return messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: JSON.parse(msg.parts),
        metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
      }));
    },

    async listChats() {
      return prisma.chat.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },

    async deleteChat(chatId: string) {
      await prisma.chat.delete({ where: { id: chatId } });
    },
  };
}

function extractTitle(message?: UIMessageLike): string {
  if (!message) return "New Chat";
  const textPart = message.parts.find((p) => p.type === "text");
  if (textPart && typeof textPart.text === "string") {
    return textPart.text.slice(0, 100);
  }
  return "New Chat";
}
