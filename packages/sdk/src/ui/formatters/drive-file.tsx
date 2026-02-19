import React from "react";
import { FileText, Folder, Image, Film, FileSpreadsheet } from "lucide-react";

interface DriveFileData {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string | number;
  webViewLink?: string;
}

interface DriveFileFormatterProps {
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

function FileCard({ file }: { file: DriveFileData }) {
  const Icon = getFileIcon(file.mimeType);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200 truncate">{file.name || "Untitled"}</p>
        {file.modifiedTime && (
          <p className="text-xs text-zinc-500">
            {new Date(file.modifiedTime).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export function DriveFileFormatter({ data }: DriveFileFormatterProps) {
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
    <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
