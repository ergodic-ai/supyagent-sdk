"use client";

import { useState } from "react";
import { openConnectPopup } from "@supyagent/sdk/connect";

interface ConnectButtonProps {
  provider: string;
  onSuccess: () => void;
}

export function ConnectButton({ provider, onSuccess }: ConnectButtonProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Get the connect URL from our API
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        throw new Error("Failed to get connect URL");
      }

      const { connectUrl } = await res.json();

      // Open OAuth popup
      await openConnectPopup({ connectUrl });

      // Success — refresh integrations
      onSuccess();
    } catch {
      // User closed popup or other error
    } finally {
      setConnecting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={connecting}
      className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {connecting ? "Connecting..." : "Connect"}
    </button>
  );
}
