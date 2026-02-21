import React from "react";
import { User, FileText, ExternalLink, Clock } from "lucide-react";

interface LinkedInProfileData {
  id?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  headline?: string;
  vanityName?: string;
  profilePicture?: unknown;
}

interface LinkedInPostData {
  id?: string;
  text?: string;
  commentary?: string;
  created?: { time?: number };
  timestamp?: string;
  author?: string;
}

interface LinkedInRendererProps {
  data: unknown;
}

function isProfile(data: unknown): data is LinkedInProfileData {
  if (typeof data !== "object" || data === null) return false;
  return "localizedFirstName" in data || "firstName" in data || ("name" in data && "headline" in data);
}

function isPost(data: unknown): data is LinkedInPostData {
  if (typeof data !== "object" || data === null) return false;
  return ("text" in data || "commentary" in data) && !("localizedFirstName" in data);
}

function formatRelativeDate(dateStr: string | number): string {
  try {
    const date = typeof dateStr === "number" ? new Date(dateStr) : new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return String(dateStr);
  }
}

function ProfileCard({ profile }: { profile: LinkedInProfileData }) {
  const name = profile.name ||
    [profile.localizedFirstName || profile.firstName, profile.localizedLastName || profile.lastName]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{name || "LinkedIn Profile"}</p>
          {profile.headline && (
            <p className="text-xs text-muted-foreground line-clamp-2">{profile.headline}</p>
          )}
          {profile.vanityName && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              linkedin.com/in/{profile.vanityName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: LinkedInPostData }) {
  const content = post.text || post.commentary;
  const time = post.created?.time || post.timestamp;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        {post.author && (
          <span className="text-xs font-medium text-foreground">{post.author}</span>
        )}
        {time && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(time)}
          </span>
        )}
      </div>
      {content && (
        <p className="text-sm text-foreground line-clamp-4">{content}</p>
      )}
    </div>
  );
}

export function LinkedInRenderer({ data }: LinkedInRendererProps) {
  // Profile
  if (isProfile(data)) return <ProfileCard profile={data} />;

  // {posts: [...]}
  if (typeof data === "object" && data !== null && "posts" in data) {
    const posts = (data as any).posts;
    if (Array.isArray(posts)) {
      return (
        <div className="space-y-1.5">
          {posts.filter(isPost).map((p, i) => <PostCard key={p.id || i} post={p} />)}
        </div>
      );
    }
  }

  // {elements: [...]}
  if (typeof data === "object" && data !== null && "elements" in data) {
    const elements = (data as any).elements;
    if (Array.isArray(elements)) {
      const posts = elements.filter(isPost);
      if (posts.length > 0) {
        return (
          <div className="space-y-1.5">
            {posts.map((p, i) => <PostCard key={p.id || i} post={p} />)}
          </div>
        );
      }
    }
  }

  if (isPost(data)) return <PostCard post={data} />;

  if (Array.isArray(data)) {
    const posts = data.filter(isPost);
    if (posts.length > 0) {
      return <div className="space-y-1.5">{posts.map((p, i) => <PostCard key={p.id || i} post={p} />)}</div>;
    }
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
