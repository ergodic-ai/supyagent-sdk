import { type UIMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });
import { createContextManager } from "@supyagent/sdk/context";
import { createPrismaAdapter } from "@supyagent/sdk/prisma";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const adapter = createPrismaAdapter(prisma);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chatId, instruction }: { chatId: string; instruction?: string } = await req.json();

  const messages = (await adapter.loadChat(chatId)) as UIMessage[];
  if (messages.length < 4) {
    return Response.json({ error: "Not enough messages to compact" }, { status: 400 });
  }

  const ctx = createContextManager({
    maxTokens: 128_000,
    summaryModel: openrouter("anthropic/claude-sonnet-4"),
    ...(instruction ? { summaryPrompt: instruction } : {}),
  });

  const compacted = await ctx.compactify(messages);
  await adapter.saveChat(chatId, compacted as any);

  return Response.json({
    messages: compacted,
    state: ctx.getState(),
  });
}
