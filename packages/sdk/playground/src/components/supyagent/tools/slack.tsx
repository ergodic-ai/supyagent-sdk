import React from "react";
import { MessageSquare, Hash, Reply } from "lucide-react";

interface SlackMessageData {
  text?: string;
  channel?: string;
  user?: string;
  ts?: string;
  ok?: boolean;
  reactions?: Array<{ name: string; count?: number }>;
  thread_ts?: string;
  reply_count?: number;
  channels?: Array<{ id?: string; name?: string; num_members?: number; memberCount?: number }>;
}

interface SlackRendererProps {
  data: unknown;
}

function isSlackMessage(data: unknown): data is SlackMessageData {
  return typeof data === "object" && data !== null && ("text" in data || "channel" in data);
}

function isChannelList(data: unknown): data is { channels: Array<{ id?: string; name?: string; num_members?: number; memberCount?: number }> } {
  return typeof data === "object" && data !== null && "channels" in data && Array.isArray((data as any).channels);
}

function MessageBubble({ message }: { message: SlackMessageData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        {message.channel && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            {message.channel}
          </span>
        )}
        {message.user && (
          <span className="text-xs font-medium text-foreground">{message.user}</span>
        )}
        {message.thread_ts && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Reply className="h-3 w-3" />
            {message.reply_count ? `${message.reply_count} replies` : "Thread"}
          </span>
        )}
      </div>
      {message.text && (
        <p className="text-sm text-foreground">{message.text}</p>
      )}
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {message.reactions.map((reaction) => (
            <span
              key={reaction.name}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              :{reaction.name}:
              {reaction.count && reaction.count > 1 && (
                <span className="font-medium">{reaction.count}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelCard({ channel }: { channel: { id?: string; name?: string; num_members?: number; memberCount?: number } }) {
  const members = channel.num_members ?? channel.memberCount;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-foreground flex-1">{channel.name || channel.id}</span>
      {members !== undefined && (
        <span className="text-xs text-muted-foreground">{members} members</span>
      )}
    </div>
  );
}

export function SlackRenderer({ data }: SlackRendererProps) {
  // Channel list response
  if (isChannelList(data)) {
    const channels = (data as any).channels;
    return (
      <div className="space-y-1.5">
        {channels.map((ch: any, i: number) => (
          <ChannelCard key={ch.id || i} channel={ch} />
        ))}
      </div>
    );
  }

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
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
