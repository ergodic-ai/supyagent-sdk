import React from "react";
import { FileText, Folder, Image, Film, FileSpreadsheet, ExternalLink, Users as UsersIcon } from "lucide-react";

interface DriveFileData {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string | number;
  webViewLink?: string;
  shared?: boolean;
}

interface DriveRendererProps {
  data: unknown;
}

function isDriveFile(data: unknown): data is DriveFileData {
  return typeof data === "object" && data !== null && ("name" in data || "mimeType" in data);
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return FileText;
  if (mimeType.includes("folder")) return Folder;
  if (mimeType.includes("image")) return Image;
  if (mimeType.includes("video")) return Film;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  return FileText;
}

function formatFileSize(size: string | number | undefined): string | null {
  if (size === undefined) return null;
  const bytes = typeof size === "string" ? parseInt(size, 10) : size;
  if (isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function FileCard({ file }: { file: DriveFileData }) {
  const Icon = getFileIcon(file.mimeType);
  const sizeStr = formatFileSize(file.size);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">
          {file.webViewLink ? (
            <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {file.name || "Untitled"}
            </a>
          ) : (
            file.name || "Untitled"
          )}
        </p>
        <div className="flex items-center gap-2">
          {file.modifiedTime && (
            <span className="text-xs text-muted-foreground">
              {new Date(file.modifiedTime).toLocaleDateString()}
            </span>
          )}
          {sizeStr && (
            <span className="text-xs text-muted-foreground">{sizeStr}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {file.shared && (
          <span title="Shared">
            <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
        {file.webViewLink && (
          <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function DriveRenderer({ data }: DriveRendererProps) {
  if (isDriveFile(data)) {
    return <FileCard file={data} />;
  }

  if (Array.isArray(data)) {
    const files = data.filter(isDriveFile);
    if (files.length > 0) {
      return (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <FileCard key={file.id || i} file={file} />
          ))}
        </div>
      );
    }
  }

  if (typeof data === "object" && data !== null && "files" in data) {
    const files = (data as { files: unknown[] }).files;
    if (Array.isArray(files)) {
      const driveFiles = files.filter(isDriveFile);
      if (driveFiles.length > 0) {
        return (
          <div className="space-y-1.5">
            {driveFiles.map((file, i) => (
              <FileCard key={file.id || i} file={file} />
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
