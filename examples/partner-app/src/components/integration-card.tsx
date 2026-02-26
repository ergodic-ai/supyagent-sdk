"use client";

import { useState } from "react";
import {
  Mail,
  MessageSquare,
  Github,
  Monitor,
  FileText,
  CircleDot,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ConnectButton } from "./connect-button";

const PROVIDER_ICONS: Record<string, LucideIcon> = {
  google: Mail,
  slack: MessageSquare,
  github: Github,
  discord: MessageSquare,
  microsoft: Monitor,
  notion: FileText,
  linear: CircleDot,
  hubspot: Users,
};

interface IntegrationCardProps {
  provider: string;
  name: string;
  description: string;
  status?: string;
  onStatusChange: () => void;
}

export function IntegrationCard({
  provider,
  name,
  description,
  status,
  onStatusChange,
}: IntegrationCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const Icon = PROVIDER_ICONS[provider] || FileText;
  const isConnected = status === "active";

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      onStatusChange();
    } catch {
      // Silently fail
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <div
          className={`h-1.5 w-1.5 rounded-full ${
            isConnected ? "bg-green-500" : "bg-muted-foreground/30"
          }`}
        />
        <span className="text-xs text-muted-foreground">
          {isConnected ? "Connected" : "Not connected"}
        </span>
      </div>

      {/* Action */}
      {isConnected ? (
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </button>
      ) : (
        <ConnectButton provider={provider} onSuccess={onStatusChange} />
      )}
    </div>
  );
}
