import React from "react";
import { CircleDot, SquareKanban, User, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface JiraIssueData {
  key?: string;
  id?: string;
  self?: string;
  fields?: {
    summary?: string;
    status?: { name?: string; statusCategory?: { colorName?: string; key?: string } };
    priority?: { name?: string; id?: string };
    assignee?: { displayName?: string; name?: string };
    issuetype?: { name?: string };
    created?: string;
  };
}

interface JiraProjectData {
  key?: string;
  id?: string;
  name?: string;
  projectTypeKey?: string;
  self?: string;
}

interface JiraFormatterProps {
  data: unknown;
}

function isJiraIssue(data: unknown): data is JiraIssueData {
  return typeof data === "object" && data !== null && "key" in data && "fields" in data;
}

function isJiraProject(data: unknown): data is JiraProjectData {
  return typeof data === "object" && data !== null && "key" in data && "name" in data && "projectTypeKey" in data;
}

const STATUS_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  "blue-gray": "bg-slate-400",
  undefined: "bg-muted-foreground",
};

function PriorityIcon({ name }: { name?: string }) {
  const lower = (name || "").toLowerCase();
  if (lower === "highest" || lower === "critical") return <ArrowUp className="h-3 w-3 text-destructive" />;
  if (lower === "high") return <ArrowUp className="h-3 w-3 text-orange-500" />;
  if (lower === "low") return <ArrowDown className="h-3 w-3 text-blue-500" />;
  if (lower === "lowest") return <ArrowDown className="h-3 w-3 text-green-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function IssueCard({ issue }: { issue: JiraIssueData }) {
  const f = issue.fields || {};
  const statusColor = f.status?.statusCategory?.colorName || "undefined";

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <CircleDot className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            <span className="text-muted-foreground font-normal">{issue.key}</span>{" "}
            {f.summary}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {f.status?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[statusColor] || STATUS_COLORS.undefined}`} />
                {f.status.name}
              </span>
            )}
            {f.priority?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <PriorityIcon name={f.priority.name} />
                {f.priority.name}
              </span>
            )}
            {f.issuetype?.name && (
              <span className="text-xs text-muted-foreground">{f.issuetype.name}</span>
            )}
            {f.assignee && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {f.assignee.displayName || f.assignee.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: JiraProjectData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <SquareKanban className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            <span className="text-muted-foreground font-normal">{project.key}</span>{" "}
            {project.name}
          </p>
          {project.projectTypeKey && (
            <p className="text-xs text-muted-foreground">{project.projectTypeKey}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function JiraFormatter({ data }: JiraFormatterProps) {
  // {issues: [...]}
  if (typeof data === "object" && data !== null && "issues" in data) {
    const issues = (data as any).issues;
    if (Array.isArray(issues)) {
      return (
        <div className="space-y-1.5">
          {issues.filter(isJiraIssue).map((iss, i) => <IssueCard key={iss.key || i} issue={iss} />)}
        </div>
      );
    }
  }

  // {projects: [...]}
  if (typeof data === "object" && data !== null && "projects" in data) {
    const projects = (data as any).projects;
    if (Array.isArray(projects)) {
      return (
        <div className="space-y-1.5">
          {projects.filter(isJiraProject).map((p, i) => <ProjectCard key={p.key || i} project={p} />)}
        </div>
      );
    }
  }

  // Single issue
  if (isJiraIssue(data)) return <IssueCard issue={data} />;

  // Single project
  if (isJiraProject(data)) return <ProjectCard project={data} />;

  // Array
  if (Array.isArray(data)) {
    const issues = data.filter(isJiraIssue);
    if (issues.length > 0) {
      return (
        <div className="space-y-1.5">
          {issues.map((iss, i) => <IssueCard key={iss.key || i} issue={iss} />)}
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
