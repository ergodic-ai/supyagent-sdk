import React from "react";
import {
  Mail,
  Calendar,
  HardDrive,
  MessageSquare,
  Github,
  type LucideIcon,
  Wrench,
  Bell,
  FileText,
  Table2,
  Presentation,
} from "lucide-react";
import { getProviderFromToolName } from "./utils.js";

const ICON_MAP: Record<string, LucideIcon> = {
  gmail: Mail,
  calendar: Calendar,
  drive: HardDrive,
  slack: MessageSquare,
  github: Github,
  discord: MessageSquare,
  notion: FileText,
  inbox: Bell,
  docs: FileText,
  sheets: Table2,
  slides: Presentation,
};

interface ProviderIconProps {
  toolName: string;
  className?: string;
}

export function ProviderIcon({ toolName, className = "h-4 w-4" }: ProviderIconProps) {
  const provider = getProviderFromToolName(toolName);
  const Icon = ICON_MAP[provider] || Wrench;
  return <Icon className={className} />;
}
