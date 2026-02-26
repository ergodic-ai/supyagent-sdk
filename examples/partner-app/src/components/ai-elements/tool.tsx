"use client";

/**
 * Adapted from Vercel AI Elements (https://github.com/vercel/ai-elements)
 * Licensed under MIT. Pre-bundled to avoid runtime npx dependency.
 *
 * Changes from upstream:
 * - Replaced @repo/shadcn-ui imports with local @/components/ui paths
 * - Removed CodeBlock dependency (Shiki) — ToolOutput accepts ReactNode directly
 * - Simplified ToolOutput to render children as-is (formatters handle their own display)
 */

import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";

// ── Tool (root) ──────────────────────────────────────────────────────────────

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("group not-prose mb-4 w-full rounded-md border", className)}
    {...props}
  />
);

// ── State types ──────────────────────────────────────────────────────────────

export type ToolState =
  | "approval-requested"
  | "approval-responded"
  | "input-available"
  | "input-streaming"
  | "output-available"
  | "output-denied"
  | "output-error";

// ── ToolHeader ───────────────────────────────────────────────────────────────

export type ToolHeaderProps = {
  title?: string;
  state: ToolState;
  type?: string;
  toolName?: string;
  icon?: ReactNode;
  className?: string;
};

const statusLabels: Record<ToolState, string> = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

const statusIcons: Record<ToolState, ReactNode> = {
  "approval-requested": <ClockIcon className="size-4 text-yellow-600" />,
  "approval-responded": <CheckCircleIcon className="size-4 text-blue-600" />,
  "input-available": <ClockIcon className="size-4 animate-pulse" />,
  "input-streaming": <CircleIcon className="size-4" />,
  "output-available": <CheckCircleIcon className="size-4 text-green-600" />,
  "output-denied": <XCircleIcon className="size-4 text-orange-600" />,
  "output-error": <XCircleIcon className="size-4 text-red-600" />,
};

export const getStatusBadge = (status: ToolState) => (
  <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
    {statusIcons[status]}
    {statusLabels[status]}
  </Badge>
);

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  toolName,
  icon,
  ...props
}: ToolHeaderProps & Omit<ComponentProps<typeof CollapsibleTrigger>, keyof ToolHeaderProps>) => {
  const derivedName = toolName ?? (type?.startsWith("tool-") ? type.slice(5) : type ?? "tool");

  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between gap-4 p-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon ?? <WrenchIcon className="size-4 text-muted-foreground" />}
        <span className="font-medium text-sm">{title ?? derivedName}</span>
        {getStatusBadge(state)}
      </div>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
};

// ── ToolContent ──────────────────────────────────────────────────────────────

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "space-y-4 p-4 text-popover-foreground outline-none",
      className
    )}
    {...props}
  />
);

// ── ToolOutput ───────────────────────────────────────────────────────────────

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ReactNode;
  isError?: boolean;
};

export const ToolOutput = ({
  className,
  output,
  isError,
  ...props
}: ToolOutputProps) => {
  if (!output) return null;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {isError ? "Error" : "Result"}
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          isError
            ? "bg-destructive/10 text-destructive"
            : "text-foreground"
        )}
      >
        {output}
      </div>
    </div>
  );
};
