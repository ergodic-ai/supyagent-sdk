import type { ConnectCallbackOptions, ConnectMessage } from "./types.js";

/**
 * Call this on the partner's redirect page after OAuth completes.
 * Reads the result from URL query params and posts it back to the
 * opener window via `postMessage`, then optionally closes the window.
 */
export function handleConnectCallback(options?: ConnectCallbackOptions): void {
  const { targetOrigin = "*", autoClose = true } = options ?? {};

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const provider = params.get("provider");
  const accountId = params.get("account_id");
  const error = params.get("error");

  const message: ConnectMessage = {
    type: "supyagent:connect",
    status: status === "success" ? "success" : "error",
    ...(provider ? { provider } : {}),
    ...(accountId ? { accountId } : {}),
    ...(error ? { error } : {}),
  };

  if (window.opener) {
    window.opener.postMessage(message, targetOrigin);
  }

  if (autoClose) {
    window.close();
  }
}
