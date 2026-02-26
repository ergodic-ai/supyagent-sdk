"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { ArrowDown, Mail, MessageSquare, Github, ExternalLink } from "lucide-react";
import { ContextIndicator } from "@supyagent/sdk/react";
import { Header } from "./header";
import Image from "next/image";

interface Integration {
  provider: string;
  status: string;
}

interface MeData {
  integrations: Integration[];
  dashboardUrl: string;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  google: <Mail className="h-4 w-4" />,
  slack: <MessageSquare className="h-4 w-4" />,
  github: <Github className="h-4 w-4" />,
  discord: <MessageSquare className="h-4 w-4" />,
  microsoft: <Mail className="h-4 w-4" />,
  notion: <ExternalLink className="h-4 w-4" />,
};

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

  const { messages, sendMessage, status, stop, addToolApprovalResponse, setMessages } = useChat({
    id: chatId,
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const [isCompacting, setIsCompacting] = useState(false);

  const handleCompact = useCallback(async () => {
    if (isCompacting || isLoading) return;
    setIsCompacting(true);
    try {
      const res = await fetch("/api/chat/compact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      if (res.ok) {
        const { messages: compactedMessages } = await res.json();
        setMessages(compactedMessages);
      }
    } catch {
      // Compact failed silently
    } finally {
      setIsCompacting(false);
    }
  }, [chatId, isCompacting, isLoading, setMessages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [meData, setMeData] = useState<MeData | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMeData(data);
      })
      .catch(() => {});
  }, []);

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

  const hasIntegrations = meData && meData.integrations.length > 0;

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
      <ChatSidebar currentChatId={chatId} />

      <div className="flex flex-1 flex-col relative">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <div className="flex h-full min-h-[60vh] items-center justify-center">
                {!hasIntegrations && meData !== null ? (
                  <div className="text-center max-w-lg">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Image src="/logo.png" alt="Supyagent" width={24} height={24} className="opacity-70" />
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Get started
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Connect your integrations to start using your AI agent.
                    </p>

                    <div className="mt-6">
                      <a
                        href="/dashboard/integrations"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        Manage integrations
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center max-w-md">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Image src="/logo.png" alt="Supyagent" width={24} height={24} className="opacity-70" />
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Partner Chat
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ask me anything — I can use your connected integrations.
                    </p>

                    {hasIntegrations && (
                      <div className="mt-4 flex justify-center gap-1.5">
                        {meData.integrations.map((integration) => (
                          <span
                            key={integration.provider}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground"
                            title={integration.provider}
                          >
                            {PROVIDER_ICONS[integration.provider] || (
                              <span className="text-[10px] font-medium uppercase">{integration.provider.slice(0, 2)}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

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
                )}
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
            <div className="flex items-center justify-end mb-1.5 min-h-[20px]">
              <ContextIndicator messages={messages} />
            </div>
            <ChatInput
              sendMessage={sendMessage}
              isLoading={isLoading}
              stop={stop}
              onCompact={handleCompact}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
