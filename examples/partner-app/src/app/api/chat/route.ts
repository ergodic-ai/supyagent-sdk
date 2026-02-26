import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
import { supyagent } from "@supyagent/sdk";
import { createContextManager } from "@supyagent/sdk/context";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const client = supyagent({ apiKey: process.env.SUPYAGENT_API_KEY! });

function extractTitle(messages: UIMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New Chat";
  const textPart = firstUserMsg.parts.find((p) => p.type === "text");
  if (textPart && "text" in textPart && typeof textPart.text === "string") {
    return textPart.text.slice(0, 100);
  }
  return "New Chat";
}

async function saveChatWithUser(
  chatId: string,
  messages: UIMessage[],
  userId: string,
) {
  const title = extractTitle(messages);

  // Upsert chat with userId included
  await prisma.chat.upsert({
    where: { id: chatId },
    create: { id: chatId, title, userId },
    update: { title },
  });

  // Upsert messages
  await prisma.$transaction(
    messages.map((msg) =>
      prisma.message.upsert({
        where: { id: msg.id },
        create: {
          id: msg.id,
          chatId,
          role: msg.role,
          parts: JSON.stringify(msg.parts),
          metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
        },
        update: {
          parts: JSON.stringify(msg.parts),
          metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
        },
      }),
    ),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    await req.json();

  await saveChatWithUser(chatId, messages, userId);

  // Use scoped client for this user's integrations
  const userClient = client.asAccount(userId);
  const { systemPrompt: skillsPrompt, tools } = await userClient.skills({
    cache: 300,
  });

  const ctx = createContextManager({
    maxTokens: 128_000,
    summaryModel: openrouter("z-ai/glm-5"),
  });

  ctx.updateEstimate(messages);

  let activeMessages = messages;
  if (ctx.shouldCompactify(messages)) {
    activeMessages = await ctx.compactify(messages);
    await saveChatWithUser(chatId, activeMessages, userId);
  }

  const systemBase = `You are a helpful assistant.\n\n${skillsPrompt}\n\nUse the loadSkill tool to get detailed instructions before using any skill. Use the apiCall tool to make authenticated API requests. When a tool execution is not approved by the user, do not retry it — explain what you were trying to do and ask how to proceed.`;
  const { messages: preparedMessages, systemPrompt } =
    await ctx.prepareMessages(activeMessages, systemBase);

  const result = streamText({
    model: openrouter("anthropic/claude-sonnet-4"),
    system: systemPrompt,
    messages: await convertToModelMessages(preparedMessages),
    tools,
    stopWhen: stepCountIs(50),
    onStepFinish: ({ usage }) => {
      ctx.recordUsage({
        inputTokens: usage.inputTokens ?? undefined,
        outputTokens: usage.outputTokens ?? undefined,
      });
    },
    prepareStep: async () => {
      if (ctx.shouldCompactify(activeMessages)) {
        activeMessages = await ctx.compactify(activeMessages);
        await saveChatWithUser(chatId, activeMessages, userId);
        const { messages: trimmed, systemPrompt: newSystem } =
          await ctx.prepareMessages(activeMessages, systemBase);
        return {
          system: newSystem,
          messages: await convertToModelMessages(trimmed),
        };
      }
      return undefined;
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      if (part.type === "finish-step") {
        return ctx.getMessageMetadata();
      }
      return undefined;
    },
    onStepFinish: async ({ messages: updatedMessages }) => {
      await saveChatWithUser(chatId, updatedMessages, userId);
    },
    onFinish: async ({ messages: updatedMessages }) => {
      await saveChatWithUser(chatId, updatedMessages, userId);

      ctx.updateEstimate(updatedMessages);
      if (ctx.shouldSummarize(updatedMessages)) {
        ctx
          .compactify(updatedMessages)
          .then((compacted) => saveChatWithUser(chatId, compacted, userId))
          .catch(() => {});
      }
    },
  });
}
