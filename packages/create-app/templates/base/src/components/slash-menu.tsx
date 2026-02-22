"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Mail,
  Calendar,
  HardDrive,
  MessageSquare,
  Github,
  Search,
  Send,
  CalendarClock,
} from "lucide-react";

interface SlashCommand {
  name: string;
  label: string;
  description: string;
  prompt: string;
  icon: React.ReactNode;
}

const COMMANDS: SlashCommand[] = [
  { name: "email", label: "/email", description: "Search my recent emails", prompt: "Search my recent emails", icon: <Mail className="h-4 w-4" /> },
  { name: "calendar", label: "/calendar", description: "What's on my calendar today?", prompt: "What's on my calendar today?", icon: <Calendar className="h-4 w-4" /> },
  { name: "drive", label: "/drive", description: "Find files in my Drive", prompt: "Find files in my Drive", icon: <HardDrive className="h-4 w-4" /> },
  { name: "slack", label: "/slack", description: "Check my Slack messages", prompt: "Check my Slack messages", icon: <MessageSquare className="h-4 w-4" /> },
  { name: "github", label: "/github", description: "Show my recent GitHub activity", prompt: "Show my recent GitHub activity", icon: <Github className="h-4 w-4" /> },
  { name: "search", label: "/search", description: "Search the web for...", prompt: "Search the web for ", icon: <Search className="h-4 w-4" /> },
  { name: "compose", label: "/compose", description: "Draft an email to...", prompt: "Draft an email to ", icon: <Send className="h-4 w-4" /> },
  { name: "schedule", label: "/schedule", description: "Schedule a meeting for...", prompt: "Schedule a meeting for ", icon: <CalendarClock className="h-4 w-4" /> },
];

interface SlashMenuProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashMenu({ query, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = COMMANDS.filter(
    (cmd) =>
      cmd.name.startsWith(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (filtered.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
          break;
        case "Enter":
          e.preventDefault();
          onSelect(filtered[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
    >
      <div className="p-1">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.name}
            ref={(el) => { itemRefs.current[i] = el; }}
            type="button"
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => setSelectedIndex(i)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
              i === selectedIndex
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span className="shrink-0 text-muted-foreground">{cmd.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{cmd.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{cmd.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { SlashCommand };
