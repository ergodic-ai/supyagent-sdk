"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { SummaryMessage, isContextSummary } from "@supyagent/sdk/react";
import { ToolMessage } from "@/components/supyagent/tool-message";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: UIMessage;
  addToolApprovalResponse?: (opts: { id: string; approved: boolean }) => void;
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="text-sm text-foreground">
      <Streamdown>{text}</Streamdown>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title="Copy message"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function ChatMessage({ message, addToolApprovalResponse }: ChatMessageProps) {
  if (isContextSummary(message)) {
    return (
      <div className="flex justify-center">
        <SummaryMessage message={message} className="max-w-[85%]" />
      </div>
    );
  }

  const isUser = message.role === "user";
  const textContent = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as any).text)
    .join("\n");

  return (
    <div className={cn("group flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-2",
          isUser
            ? "rounded-2xl rounded-br-md bg-secondary px-4 py-2.5"
            : "w-full max-w-none"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            if (isUser) {
              return (
                <p key={i} className="text-sm text-foreground whitespace-pre-wrap">
                  {(part as any).text}
                </p>
              );
            }
            return <MarkdownContent key={i} text={(part as any).text} />;
          }

          if (part.type === "file") {
            const filePart = part as { type: "file"; mediaType?: string; url: string; filename?: string };
            if (filePart.mediaType?.startsWith("image/")) {
              return (
                <img
                  key={i}
                  src={filePart.url}
                  alt={filePart.filename || "Image"}
                  className="rounded-lg max-w-full max-h-96 object-contain"
                />
              );
            }
            if (filePart.mediaType?.startsWith("audio/")) {
              return <audio key={i} controls src={filePart.url} className="w-full max-w-md" />;
            }
            return (
              <a
                key={i}
                href={filePart.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                {filePart.filename || "Download file"}
              </a>
            );
          }

          if (isToolUIPart(part)) {
            return <ToolMessage key={i} part={part} addToolApprovalResponse={addToolApprovalResponse} />;
          }

          return null;
        })}

        {/* Message actions */}
        {!isUser && textContent && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            <CopyButton text={textContent} />
          </div>
        )}
      </div>
    </div>
  );
}
