import React from "react";
import { CircleDot, FolderKanban } from "lucide-react";

interface LinearIssueData {
  id?: string;
  title?: string;
  identifier?: string;
  state?: { name?: string; color?: string; type?: string };
  priority?: number;
  priorityLabel?: string;
  assignee?: { name?: string; displayName?: string; email?: string };
  url?: string;
  description?: string;
}

interface LinearProjectData {
  id?: string;
  name?: string;
  state?: string;
  progress?: number;
  url?: string;
  description?: string;
}

interface LinearRendererProps {
  data: unknown;
}

function isLinearIssue(data: unknown): data is LinearIssueData {
  if (typeof data !== "object" || data === null) return false;
  return ("title" in data && ("identifier" in data || "state" in data || "priority" in data));
}

function isLinearProject(data: unknown): data is LinearProjectData {
  if (typeof data !== "object" || data === null) return false;
  return "name" in data && ("progress" in data || ("state" in data && typeof (data as any).state === "string"));
}

const PRIORITY_LABELS: Record<number, { label: string; style: string }> = {
  0: { label: "No priority", style: "text-muted-foreground" },
  1: { label: "Urgent", style: "text-destructive" },
  2: { label: "High", style: "text-orange-500" },
  3: { label: "Medium", style: "text-yellow-500" },
  4: { label: "Low", style: "text-muted-foreground" },
};

function IssueCard({ issue }: { issue: LinearIssueData }) {
  const priorityInfo = issue.priority !== undefined ? PRIORITY_LABELS[issue.priority] : null;
  const assigneeName = issue.assignee?.displayName || issue.assignee?.name;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <CircleDot
          className="h-4 w-4 mt-0.5 shrink-0"
          style={issue.state?.color ? { color: issue.state.color } : undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {issue.url ? (
              <a href={issue.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {issue.title}
              </a>
            ) : (
              issue.title
            )}
            {issue.identifier && (
              <span className="text-muted-foreground font-normal"> {issue.identifier}</span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {issue.state?.name && (
              <span
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
                style={issue.state.color ? { color: issue.state.color } : undefined}
              >
                {issue.state.name}
              </span>
            )}
            {priorityInfo && (
              <span className={`text-xs ${priorityInfo.style}`}>
                {issue.priorityLabel || priorityInfo.label}
              </span>
            )}
            {assigneeName && (
              <span className="text-xs text-muted-foreground">{assigneeName}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: LinearProjectData }) {
  const progressPercent = project.progress !== undefined ? Math.round(project.progress * 100) : null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <FolderKanban className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {project.url ? (
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {project.name}
              </a>
            ) : (
              project.name
            )}
          </p>
          {project.state && (
            <span className="text-xs text-muted-foreground">{project.state}</span>
          )}
        </div>
      </div>
      {progressPercent !== null && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{progressPercent}%</p>
        </div>
      )}
    </div>
  );
}

export function LinearRenderer({ data }: LinearRendererProps) {
  if (isLinearIssue(data)) {
    return <IssueCard issue={data} />;
  }

  if (isLinearProject(data)) {
    return <ProjectCard project={data} />;
  }

  if (Array.isArray(data)) {
    const issues = data.filter(isLinearIssue);
    if (issues.length > 0) {
      return (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <IssueCard key={issue.id || i} issue={issue} />
          ))}
        </div>
      );
    }
    const projects = data.filter(isLinearProject);
    if (projects.length > 0) {
      return (
        <div className="space-y-2">
          {projects.map((project, i) => (
            <ProjectCard key={project.id || i} project={project} />
          ))}
        </div>
      );
    }
  }

  // Object with nodes/issues array (Linear API pattern)
  if (typeof data === "object" && data !== null) {
    const arr = (data as any).nodes || (data as any).issues || (data as any).projects;
    if (Array.isArray(arr)) {
      const issues = arr.filter(isLinearIssue);
      if (issues.length > 0) {
        return (
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <IssueCard key={issue.id || i} issue={issue} />
            ))}
          </div>
        );
      }
      const projects = arr.filter(isLinearProject);
      if (projects.length > 0) {
        return (
          <div className="space-y-2">
            {projects.map((project, i) => (
              <ProjectCard key={project.id || i} project={project} />
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
