import React from "react";
import { CircleDot, GitPullRequest, GitMerge, Clock } from "lucide-react";

interface GithubItemData {
  title?: string;
  number?: number;
  state?: string;
  html_url?: string;
  body?: string;
  user?: { login?: string };
  created_at?: string;
  pull_request?: unknown;
  merged?: boolean;
  labels?: Array<{ name: string; color?: string }>;
}

interface GithubFormatterProps {
  data: unknown;
}

function isGithubItem(data: unknown): data is GithubItemData {
  return typeof data === "object" && data !== null && ("title" in data || "number" in data);
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getStateInfo(item: GithubItemData) {
  const isPR = !!item.pull_request;

  if (isPR && item.merged) {
    return { icon: GitMerge, color: "text-purple-500", label: "Merged" };
  }
  if (item.state === "open") {
    return {
      icon: isPR ? GitPullRequest : CircleDot,
      color: "text-green-500",
      label: "Open",
    };
  }
  return {
    icon: isPR ? GitPullRequest : CircleDot,
    color: "text-destructive",
    label: "Closed",
  };
}

function GithubCard({ item }: { item: GithubItemData }) {
  const { icon: StateIcon, color: stateColor, label: stateLabel } = getStateInfo(item);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <StateIcon className={`h-4 w-4 mt-0.5 shrink-0 ${stateColor}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {item.html_url ? (
              <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {item.title}
              </a>
            ) : (
              item.title
            )}
            {item.number && (
              <span className="text-muted-foreground font-normal"> #{item.number}</span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${stateColor}`}>{stateLabel}</span>
            {item.user?.login && (
              <span className="text-xs text-muted-foreground">{item.user.login}</span>
            )}
            {item.created_at && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatRelativeDate(item.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>
      {item.labels && item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.labels.map((label) => (
            <span
              key={label.name}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
              style={
                label.color
                  ? { borderColor: `#${label.color}`, color: `#${label.color}` }
                  : undefined
              }
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      {item.body && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
      )}
    </div>
  );
}

export function GithubFormatter({ data }: GithubFormatterProps) {
  if (isGithubItem(data)) {
    return <GithubCard item={data} />;
  }

  if (Array.isArray(data)) {
    const items = data.filter(isGithubItem);
    if (items.length > 0) {
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <GithubCard key={item.number || i} item={item} />
          ))}
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
