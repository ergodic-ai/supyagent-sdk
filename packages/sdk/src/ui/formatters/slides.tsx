import React from "react";
import { Presentation, ExternalLink } from "lucide-react";

interface SlidesData {
  presentationId?: string;
  title?: string;
  url?: string;
  slides?: unknown[];
  pageSize?: unknown;
}

interface SlidesFormatterProps {
  data: unknown;
}

function isSlidesData(data: unknown): data is SlidesData {
  return typeof data === "object" && data !== null && ("presentationId" in data || ("title" in data && "slides" in data));
}

function SlidesCard({ presentation }: { presentation: SlidesData }) {
  const slideUrl = presentation.url || (presentation.presentationId ? `https://docs.google.com/presentation/d/${presentation.presentationId}` : null);
  const slideCount = presentation.slides?.length;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <Presentation className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {slideUrl ? (
              <a href={slideUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {presentation.title || "Presentation"}
              </a>
            ) : (
              presentation.title || "Presentation"
            )}
          </p>
          {slideCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {slideCount} {slideCount === 1 ? "slide" : "slides"}
            </p>
          )}
        </div>
        {slideUrl && (
          <a href={slideUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function SlidesFormatter({ data }: SlidesFormatterProps) {
  if (isSlidesData(data)) {
    return <SlidesCard presentation={data} />;
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
