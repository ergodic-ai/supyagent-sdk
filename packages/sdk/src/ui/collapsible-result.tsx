import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ProviderIcon } from "./provider-icon.js";
import { getProviderLabel, getProviderFromToolName } from "./utils.js";

interface BadgeProps {
  text: string;
  variant?: "default" | "success" | "error" | "warning";
}

export interface CollapsibleResultProps {
  toolName: string;
  summary: string;
  badge?: BadgeProps;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

const BADGE_STYLES: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-500",
  error: "bg-destructive/10 text-destructive",
  warning: "bg-yellow-500/10 text-yellow-600",
};

export function CollapsibleResult({
  toolName,
  summary,
  badge,
  defaultExpanded = false,
  children,
}: CollapsibleResultProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const provider = getProviderFromToolName(toolName);
  const providerLabel = getProviderLabel(provider);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted transition-colors"
      >
        <ProviderIcon toolName={toolName} className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{providerLabel}</span>
        <span className="text-sm text-foreground flex-1 truncate">{summary}</span>

        {badge && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              BADGE_STYLES[badge.variant || "default"]
            }`}
          >
            {badge.text}
          </span>
        )}

        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-3 py-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
