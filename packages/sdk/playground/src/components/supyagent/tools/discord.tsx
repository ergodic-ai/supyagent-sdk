import React from "react";
import { MessageSquare, Hash, Shield, Users } from "lucide-react";

interface GuildData {
  id?: string;
  name?: string;
  owner?: boolean;
  member_count?: number;
  icon?: string;
}

interface ChannelData {
  id?: string;
  name?: string;
  type?: number;
  position?: number;
  member_count?: number;
}

interface MessageData {
  id?: string;
  content?: string;
  author?: { username?: string; id?: string };
  timestamp?: string;
  channel_id?: string;
}

interface DiscordRendererProps {
  data: unknown;
}

function isGuildData(data: unknown): data is GuildData {
  return typeof data === "object" && data !== null && "name" in data && ("owner" in data || "member_count" in data || "icon" in data);
}

function isChannelData(data: unknown): data is ChannelData {
  return typeof data === "object" && data !== null && "name" in data && ("type" in data || "position" in data);
}

function isMessageData(data: unknown): data is MessageData {
  return typeof data === "object" && data !== null && ("content" in data || "author" in data) && "id" in data;
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function GuildCard({ guild }: { guild: GuildData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">{guild.name}</span>
        {guild.owner && (
          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600">Owner</span>
        )}
      </div>
      {guild.member_count !== undefined && (
        <div className="flex items-center gap-1 pl-6 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {guild.member_count} members
        </div>
      )}
    </div>
  );
}

function ChannelCard({ channel }: { channel: ChannelData }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-foreground flex-1">{channel.name || channel.id}</span>
      {channel.member_count !== undefined && (
        <span className="text-xs text-muted-foreground">{channel.member_count} members</span>
      )}
    </div>
  );
}

function MessageCard({ message }: { message: MessageData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        {message.author?.username && (
          <span className="text-xs font-medium text-foreground">{message.author.username}</span>
        )}
        {message.timestamp && (
          <span className="text-xs text-muted-foreground ml-auto">{formatRelativeDate(message.timestamp)}</span>
        )}
      </div>
      {message.content && (
        <p className="text-sm text-foreground line-clamp-3">{message.content}</p>
      )}
    </div>
  );
}

export function DiscordRenderer({ data }: DiscordRendererProps) {
  // Guilds
  if (typeof data === "object" && data !== null && "guilds" in data) {
    const guilds = (data as any).guilds;
    if (Array.isArray(guilds)) {
      return (
        <div className="space-y-1.5">
          {guilds.filter(isGuildData).map((g, i) => <GuildCard key={g.id || i} guild={g} />)}
        </div>
      );
    }
  }

  // Channels
  if (typeof data === "object" && data !== null && "channels" in data) {
    const channels = (data as any).channels;
    if (Array.isArray(channels)) {
      return (
        <div className="space-y-1.5">
          {channels.filter(isChannelData).map((c, i) => <ChannelCard key={c.id || i} channel={c} />)}
        </div>
      );
    }
  }

  // Messages
  if (typeof data === "object" && data !== null && "messages" in data) {
    const messages = (data as any).messages;
    if (Array.isArray(messages)) {
      return (
        <div className="space-y-2">
          {messages.filter(isMessageData).map((m, i) => <MessageCard key={m.id || i} message={m} />)}
        </div>
      );
    }
  }

  // Single message
  if (isMessageData(data)) return <MessageCard message={data} />;

  // Array
  if (Array.isArray(data)) {
    const guilds = data.filter(isGuildData);
    if (guilds.length > 0) {
      return (
        <div className="space-y-1.5">{guilds.map((g, i) => <GuildCard key={g.id || i} guild={g} />)}</div>
      );
    }
    const messages = data.filter(isMessageData);
    if (messages.length > 0) {
      return (
        <div className="space-y-2">{messages.map((m, i) => <MessageCard key={m.id || i} message={m} />)}</div>
      );
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
