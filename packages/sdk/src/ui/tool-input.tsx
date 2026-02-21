import React from "react";

interface ToolInputProps {
  args: Record<string, unknown> | undefined;
}

function formatValue(value: unknown): { text: string; muted?: boolean } {
  if (value === null || value === undefined) {
    return { text: "null", muted: true };
  }
  if (typeof value === "boolean") {
    return { text: String(value), muted: true };
  }
  if (typeof value === "number") {
    return { text: String(value) };
  }
  if (typeof value === "string") {
    return { text: value };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { text: "[]", muted: true };
    // Simple arrays (primitives only): comma-join
    const allPrimitive = value.every(
      (v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
    );
    if (allPrimitive) {
      const joined = value.join(", ");
      return { text: joined.length > 80 ? joined.slice(0, 77) + "..." : joined };
    }
    return { text: `${value.length} items`, muted: true };
  }
  if (typeof value === "object") {
    const json = JSON.stringify(value);
    if (json.length <= 60) return { text: json, muted: true };
    return { text: json.slice(0, 57) + "...", muted: true };
  }
  return { text: String(value) };
}

export function ToolInput({ args }: ToolInputProps) {
  if (!args || Object.keys(args).length === 0) return null;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {Object.entries(args).map(([key, value]) => {
        const formatted = formatValue(value);
        return (
          <React.Fragment key={key}>
            <span className="text-muted-foreground select-none">{key}</span>
            <span className={formatted.muted ? "text-muted-foreground" : "text-foreground"}>
              {formatted.text}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
