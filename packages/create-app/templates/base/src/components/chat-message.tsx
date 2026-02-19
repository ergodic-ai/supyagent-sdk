"use client";

import type { UIMessage } from "ai";
import { SupyagentToolCall, SupyagentToolResult } from "@supyagent/sdk/react";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-2 ${
          isUser
            ? "rounded-2xl rounded-br-md bg-zinc-800 px-4 py-2.5"
            : ""
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className="text-sm text-zinc-200 whitespace-pre-wrap">
                {part.text}
              </p>
            );
          }

          if (part.type === "tool-invocation") {
            return (
              <div key={i} className="space-y-2">
                <SupyagentToolCall part={part as any} />
                <SupyagentToolResult part={part as any} />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
