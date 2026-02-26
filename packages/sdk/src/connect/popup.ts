import type { ConnectMessage, ConnectPopupOptions, ConnectPopupResult } from "./types.js";

/**
 * Opens an OAuth connect popup and returns a promise that resolves
 * when the flow completes. The partner's redirect page must call
 * `handleConnectCallback()` to post the result back via `postMessage`.
 */
export function openConnectPopup(options: ConnectPopupOptions): Promise<ConnectPopupResult> {
  const { connectUrl, width = 500, height = 700, onSuccess, onError } = options;

  return new Promise<ConnectPopupResult>((resolve, reject) => {
    // Center the popup on screen
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const features = `width=${width},height=${height},left=${left},top=${top},popup=1`;

    const popup = window.open(connectUrl, "supyagent_connect", features);

    if (!popup) {
      const err = new Error(
        "Popup was blocked by the browser. Please allow popups for this site.",
      );
      onError?.(err);
      reject(err);
      return;
    }

    // Capture non-null ref so TS narrows inside closures
    const popupRef = popup;
    let settled = false;

    function cleanup() {
      window.removeEventListener("message", onMessage);
      clearInterval(pollTimer);
    }

    function onMessage(event: MessageEvent) {
      const data = event.data as ConnectMessage | undefined;
      if (!data || data.type !== "supyagent:connect") return;

      settled = true;
      cleanup();

      try {
        popupRef.close();
      } catch {
        // Ignore if already closed
      }

      if (data.status === "success" && data.provider && data.accountId) {
        const result: ConnectPopupResult = {
          status: "success",
          provider: data.provider,
          accountId: data.accountId,
        };
        onSuccess?.(result);
        resolve(result);
      } else {
        const err = new Error(data.error || "OAuth connect failed");
        onError?.(err);
        reject(err);
      }
    }

    window.addEventListener("message", onMessage);

    // Poll for manual popup close
    const pollTimer = setInterval(() => {
      if (!settled && popupRef.closed) {
        settled = true;
        cleanup();
        const err = new Error("Popup was closed before completing the OAuth flow");
        onError?.(err);
        reject(err);
      }
    }, 500);
  });
}
