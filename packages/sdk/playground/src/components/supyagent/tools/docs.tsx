import React from "react";
import { FileText, ExternalLink } from "lucide-react";

interface DocData {
  documentId?: string;
  title?: string;
  body?: { content?: unknown };
  revisionId?: string;
  url?: string;
  content?: string;
}

interface DocsRendererProps {
  data: unknown;
}

function isDocData(data: unknown): data is DocData {
  return typeof data === "object" && data !== null && ("documentId" in data || "title" in data);
}

function extractTextContent(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const content = (body as any).content;
  if (!Array.isArray(content)) return null;

  const texts: string[] = [];
  for (const element of content) {
    if (element?.paragraph?.elements) {
      for (const el of element.paragraph.elements) {
        if (el?.textRun?.content) {
          texts.push(el.textRun.content);
        }
      }
    }
  }
  return texts.length > 0 ? texts.join("").trim() : null;
}

function DocCard({ doc }: { doc: DocData }) {
  const docUrl = doc.url || (doc.documentId ? `https://docs.google.com/document/d/${doc.documentId}` : null);
  const textContent = doc.content || extractTextContent(doc.body);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {docUrl ? (
              <a href={docUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {doc.title || "Untitled document"}
              </a>
            ) : (
              doc.title || "Untitled document"
            )}
          </p>
        </div>
        {docUrl && (
          <a href={docUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {textContent && (
        <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{textContent}</p>
      )}
    </div>
  );
}

export function DocsRenderer({ data }: DocsRendererProps) {
  if (isDocData(data)) {
    return <DocCard doc={data} />;
  }

  if (Array.isArray(data)) {
    const docs = data.filter(isDocData);
    if (docs.length > 0) {
      return (
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <DocCard key={doc.documentId || i} doc={doc} />
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
