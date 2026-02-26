"use client";

import { useEffect } from "react";
import { handleConnectCallback } from "@supyagent/sdk/connect";

export default function CallbackPage() {
  useEffect(() => {
    handleConnectCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        <p className="text-sm text-muted-foreground">Connecting...</p>
      </div>
    </div>
  );
}
