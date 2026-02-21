"use client";

import { ArrowUp, Square, Paperclip, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { FormEvent, KeyboardEvent, DragEvent, ClipboardEvent } from "react";

interface ChatInputProps {
  sendMessage: (message: {
    text: string;
    files?: Array<{ type: "file"; url: string; mediaType: string; filename?: string }>;
  }) => Promise<void>;
  isLoading: boolean;
  stop: () => void;
}

const MAX_BASE64_BYTES = 4.5 * 1024 * 1024; // stay well under provider 5MB limit
const MAX_DIMENSION = 2048;

function compressImage(file: File): Promise<{ url: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Scale down if too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try JPEG at decreasing quality until under size limit
      let quality = 0.85;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length * 0.75 > MAX_BASE64_BYTES && quality > 0.1) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      resolve({ url: dataUrl, mediaType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function ChatInput({ sendMessage, isLoading, stop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length > 0) {
      setFiles((prev) => [...prev, ...imageFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && files.length === 0) || isLoading) return;

    let fileUIParts:
      | Array<{ type: "file"; url: string; mediaType: string; filename?: string }>
      | undefined;
    if (files.length > 0) {
      fileUIParts = await Promise.all(
        files.map(async (f) => {
          const { url, mediaType } = await compressImage(f);
          return {
            type: "file" as const,
            url,
            mediaType,
            filename: f.name,
          };
        })
      );
    }

    sendMessage({
      text: input,
      ...(fileUIParts ? { files: fileUIParts } : {}),
    });
    setInput("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || files.length > 0) && !isLoading) {
        handleSubmit(e as unknown as FormEvent);
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.files;
    if (items && items.length > 0) {
      addFiles(items);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const hasContent = input.trim() || files.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col rounded-xl border bg-card transition-colors ${
        isDragging
          ? "border-ring ring-1 ring-ring"
          : "border-border focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
      }`}
    >
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 px-3 pt-3 pb-0 flex-wrap">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end">
        {/* Paperclip button */}
        <div className="p-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Attach image"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Send a message..."
          rows={1}
          className="flex-1 resize-none bg-transparent py-3 text-sm text-foreground placeholder-muted-foreground outline-none max-h-[200px]"
        />
        <div className="p-2">
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!hasContent}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
