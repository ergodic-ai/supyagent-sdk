import React from "react";

interface GenericRendererProps {
  data: unknown;
}

export function GenericRenderer({ data }: GenericRendererProps) {
  if (data === null || data === undefined) {
    return (
      <p className="text-sm text-muted-foreground italic">No data returned</p>
    );
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
