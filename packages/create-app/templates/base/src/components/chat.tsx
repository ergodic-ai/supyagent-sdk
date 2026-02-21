"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { MessageSquare, ArrowDown } from "lucide-react";

interface ChatProps {
  chatId: string;
  initialMessages: UIMessage[];
}

export function Chat({ chatId, initialMessages }: ChatProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId]
  );

  const { messages, sendMessage, status, stop, addToolApprovalResponse } = useChat({
    id: chatId,
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 100;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setIsAtBottom(atBottom);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  const suggestions = [
    "What integrations are connected?",
    "Search my recent emails",
    "What's on my calendar today?",
  ];

  return (
    <div className="flex h-screen">
      <ChatSidebar currentChatId={chatId} />

      <div className="flex flex-1 flex-col relative">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <div className="flex h-full min-h-[60vh] items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Supyagent Chat
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ask me anything — I can use your connected integrations.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => sendMessage({ text: suggestion })}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} addToolApprovalResponse={addToolApprovalResponse} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-lg hover:bg-muted transition-colors"
          >
            <ArrowDown className="h-3 w-3" />
            Scroll to bottom
          </button>
        )}

        <div className="border-t border-border px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              sendMessage={sendMessage}
              isLoading={isLoading}
              stop={stop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
