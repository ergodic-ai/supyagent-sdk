import React from "react";

interface GenericFormatterProps {
  data: unknown;
}

export function GenericFormatter({ data }: GenericFormatterProps) {
  if (data === null || data === undefined) {
    return (
      <p className="text-sm text-zinc-500 italic">No data returned</p>
    );
  }

  return (
    <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
