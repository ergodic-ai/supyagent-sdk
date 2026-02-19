import React from "react";
import { Github, CircleDot, GitPullRequest } from "lucide-react";

interface GithubItemData {
  title?: string;
  number?: number;
  state?: string;
  html_url?: string;
  body?: string;
  user?: { login?: string };
  created_at?: string;
  pull_request?: unknown;
}

interface GithubFormatterProps {
  data: unknown;
}

function isGithubItem(data: unknown): data is GithubItemData {
  return typeof data === "object" && data !== null && ("title" in data || "number" in data);
}

function GithubCard({ item }: { item: GithubItemData }) {
  const isPR = !!item.pull_request;
  const stateColor =
    item.state === "open"
      ? "text-green-400"
      : item.state === "closed"
        ? "text-red-400"
        : "text-zinc-400";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        {isPR ? (
          <GitPullRequest className={`h-4 w-4 mt-0.5 shrink-0 ${stateColor}`} />
        ) : (
          <CircleDot className={`h-4 w-4 mt-0.5 shrink-0 ${stateColor}`} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">
            {item.title}
            {item.number && (
              <span className="text-zinc-500 font-normal"> #{item.number}</span>
            )}
          </p>
          {item.user?.login && (
            <p className="text-xs text-zinc-400">{item.user.login}</p>
          )}
        </div>
      </div>
      {item.body && (
        <p className="text-xs text-zinc-400 line-clamp-2">{item.body}</p>
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
    <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
