"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { useRef, useEffect } from "react";

interface ChatProps {
  chatId: string;
  initialMessages: UIMessage[];
}

export function Chat({ chatId, initialMessages }: ChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      api: "/api/chat",
      body: { chatId },
      initialMessages,
    });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-screen">
      <ChatSidebar currentChatId={chatId} />

      <div className="flex flex-1 flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <div className="flex h-full min-h-[60vh] items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-zinc-200">
                    Supyagent Chat
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    Ask me anything — I can use your connected integrations.
                  </p>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800 px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
