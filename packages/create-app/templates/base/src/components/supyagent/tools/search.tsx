import React from "react";
import { ExternalLink, Search } from "lucide-react";

interface SearchResult {
  title?: string;
  link?: string;
  url?: string;
  snippet?: string;
  description?: string;
  position?: number;
}

interface SearchData {
  results?: SearchResult[];
  organic?: SearchResult[];
  answer?: string;
  answerBox?: { answer?: string; snippet?: string; title?: string };
  relatedSearches?: Array<{ query?: string }>;
  related_searches?: Array<{ query?: string }>;
}

interface SearchRendererProps {
  data: unknown;
}

function isSearchData(data: unknown): data is SearchData {
  if (typeof data !== "object" || data === null) return false;
  return "results" in data || "organic" in data || "answer" in data || "answerBox" in data;
}

function isSearchResult(data: unknown): data is SearchResult {
  return typeof data === "object" && data !== null && ("title" in data || "link" in data || "url" in data);
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function ResultCard({ result }: { result: SearchResult }) {
  const href = result.link || result.url;
  const snippet = result.snippet || result.description;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {result.title || href}
            </a>
          ) : (
            <p className="text-sm font-medium text-foreground">{result.title}</p>
          )}
          {href && (
            <p className="text-xs text-muted-foreground truncate">{getDomain(href)}</p>
          )}
        </div>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {snippet && (
        <p className="text-xs text-muted-foreground line-clamp-2">{snippet}</p>
      )}
    </div>
  );
}

export function SearchRenderer({ data }: SearchRendererProps) {
  if (isSearchData(data)) {
    const results = data.results || data.organic || [];
    const answerText = data.answer || data.answerBox?.answer || data.answerBox?.snippet;
    const related = data.relatedSearches || data.related_searches;

    return (
      <div className="space-y-3">
        {answerText && (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-foreground">{answerText}</p>
            {data.answerBox?.title && (
              <p className="text-xs text-muted-foreground mt-1">{data.answerBox.title}</p>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.filter(isSearchResult).map((result, i) => (
              <ResultCard key={result.link || result.url || i} result={result} />
            ))}
          </div>
        )}

        {related && related.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {related.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Search className="h-3 w-3" />
                {r.query}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Array of results
  if (Array.isArray(data)) {
    const results = data.filter(isSearchResult);
    if (results.length > 0) {
      return (
        <div className="space-y-2">
          {results.map((result, i) => (
            <ResultCard key={result.link || result.url || i} result={result} />
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
