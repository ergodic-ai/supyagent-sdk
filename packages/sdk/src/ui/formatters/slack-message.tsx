import React from "react";
import { MessageSquare, Hash } from "lucide-react";

interface SlackMessageData {
  text?: string;
  channel?: string;
  user?: string;
  ts?: string;
  ok?: boolean;
}

interface SlackMessageFormatterProps {
  data: unknown;
}

function isSlackMessage(data: unknown): data is SlackMessageData {
  return typeof data === "object" && data !== null && ("text" in data || "channel" in data);
}

function MessageBubble({ message }: { message: SlackMessageData }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-zinc-400 shrink-0" />
        {message.channel && (
          <span className="flex items-center gap-0.5 text-xs text-zinc-400">
            <Hash className="h-3 w-3" />
            {message.channel}
          </span>
        )}
        {message.user && (
          <span className="text-xs text-zinc-500">{message.user}</span>
        )}
      </div>
      {message.text && (
        <p className="text-sm text-zinc-300">{message.text}</p>
      )}
    </div>
  );
}

export function SlackMessageFormatter({ data }: SlackMessageFormatterProps) {
  if (isSlackMessage(data)) {
    return <MessageBubble message={data} />;
  }

  if (Array.isArray(data)) {
    const messages = data.filter(isSlackMessage);
    if (messages.length > 0) {
      return (
        <div className="space-y-2">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.ts || i} message={msg} />
          ))}
        </div>
      );
    }
  }

  if (typeof data === "object" && data !== null && "messages" in data) {
    const messages = (data as { messages: unknown[] }).messages;
    if (Array.isArray(messages)) {
      const slackMsgs = messages.filter(isSlackMessage);
      if (slackMsgs.length > 0) {
        return (
          <div className="space-y-2">
            {slackMsgs.map((msg, i) => (
              <MessageBubble key={msg.ts || i} message={msg} />
            ))}
          </div>
        );
      }
    }
  }

  return (
    <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
