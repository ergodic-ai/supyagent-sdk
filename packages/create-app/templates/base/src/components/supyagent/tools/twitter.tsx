import React from "react";
import { MessageCircle, Heart, Repeat2, Clock } from "lucide-react";

interface TweetData {
  id?: string;
  text?: string;
  author_username?: string;
  username?: string;
  author?: { username?: string; name?: string };
  created_at?: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
  };
  like_count?: number;
  retweet_count?: number;
}

interface TwitterRendererProps {
  data: unknown;
}

function isTweetData(data: unknown): data is TweetData {
  return typeof data === "object" && data !== null && "text" in data;
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

function TweetCard({ tweet }: { tweet: TweetData }) {
  const username = tweet.author_username || tweet.username || tweet.author?.username;
  const likes = tweet.public_metrics?.like_count ?? tweet.like_count;
  const retweets = tweet.public_metrics?.retweet_count ?? tweet.retweet_count;
  const replies = tweet.public_metrics?.reply_count;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        {username && (
          <span className="text-xs font-medium text-foreground">@{username}</span>
        )}
        {tweet.author?.name && (
          <span className="text-xs text-muted-foreground">{tweet.author.name}</span>
        )}
        {tweet.created_at && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(tweet.created_at)}
          </span>
        )}
      </div>
      {tweet.text && (
        <p className="text-sm text-foreground line-clamp-4">{tweet.text}</p>
      )}
      {(likes !== undefined || retweets !== undefined || replies !== undefined) && (
        <div className="flex items-center gap-4 pt-0.5">
          {likes !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              {likes}
            </span>
          )}
          {retweets !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat2 className="h-3 w-3" />
              {retweets}
            </span>
          )}
          {replies !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              {replies}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TwitterRenderer({ data }: TwitterRendererProps) {
  // {tweets: [...]}
  if (typeof data === "object" && data !== null && "tweets" in data) {
    const tweets = (data as any).tweets;
    if (Array.isArray(tweets)) {
      return (
        <div className="space-y-2">
          {tweets.filter(isTweetData).map((t, i) => <TweetCard key={t.id || i} tweet={t} />)}
        </div>
      );
    }
  }

  // {data: [...]} (Twitter API v2 shape)
  if (typeof data === "object" && data !== null && "data" in data && Array.isArray((data as any).data)) {
    const tweets = (data as any).data;
    return (
      <div className="space-y-2">
        {tweets.filter(isTweetData).map((t: TweetData, i: number) => <TweetCard key={t.id || i} tweet={t} />)}
      </div>
    );
  }

  if (isTweetData(data)) return <TweetCard tweet={data} />;

  if (Array.isArray(data)) {
    const tweets = data.filter(isTweetData);
    if (tweets.length > 0) {
      return (
        <div className="space-y-2">
          {tweets.map((t, i) => <TweetCard key={t.id || i} tweet={t} />)}
        </div>
      );
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
