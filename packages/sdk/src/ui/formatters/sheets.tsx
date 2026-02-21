import React from "react";
import { Table2, ExternalLink } from "lucide-react";

interface SheetsData {
  spreadsheetId?: string;
  title?: string;
  url?: string;
  values?: unknown[][];
  range?: string;
  updatedRange?: string;
  updatedRows?: number;
  updatedColumns?: number;
  updatedCells?: number;
  sheets?: Array<{ properties?: { title?: string; sheetId?: number } }>;
}

interface SheetsFormatterProps {
  data: unknown;
}

function isSheetsData(data: unknown): data is SheetsData {
  return typeof data === "object" && data !== null && ("spreadsheetId" in data || "values" in data || "range" in data || "updatedRange" in data);
}

function SheetsTable({ values }: { values: unknown[][] }) {
  if (values.length === 0) return null;

  const headers = values[0] as string[];
  const rows = values.slice(1);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted">
            {headers.map((header, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                {String(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border last:border-0">
              {headers.map((_, colIdx) => (
                <td key={colIdx} className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                  {String((row as unknown[])[colIdx] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SheetsCard({ sheet }: { sheet: SheetsData }) {
  const sheetUrl = sheet.url || (sheet.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}` : null);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-start gap-2">
          <Table2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {sheetUrl ? (
                <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {sheet.title || "Spreadsheet"}
                </a>
              ) : (
                sheet.title || "Spreadsheet"
              )}
            </p>
            {(sheet.updatedRange || sheet.range) && (
              <p className="text-xs text-muted-foreground">
                {sheet.updatedRange || sheet.range}
                {sheet.updatedCells !== undefined && ` \u00B7 ${sheet.updatedCells} cells updated`}
              </p>
            )}
          </div>
          {sheetUrl && (
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {sheet.values && sheet.values.length > 0 && (
        <SheetsTable values={sheet.values} />
      )}
    </div>
  );
}

export function SheetsFormatter({ data }: SheetsFormatterProps) {
  if (isSheetsData(data)) {
    return <SheetsCard sheet={data} />;
  }

  return (
    <pre className="rounded-lg border border-border bg-background p-3 text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
