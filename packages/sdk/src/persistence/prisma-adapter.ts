import type { ChatAdapter, ChatSummary, UIMessageLike } from "./types.js";

/**
 * Accepts any PrismaClient instance.
 * We use `any` here because Prisma generates unique client types per schema,
 * and a structural interface can't satisfy Prisma's branded enum types
 * (e.g. SortOrder). The implementation only calls standard Prisma methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

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

      return messages.map((msg: { id: string; role: string; parts: string; metadata: string | null }) => ({
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
