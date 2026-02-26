/** Shape of the postMessage sent from the redirect page back to the opener */
export interface ConnectMessage {
  type: "supyagent:connect";
  status: "success" | "error";
  provider?: string;
  accountId?: string;
  error?: string;
}

/** Options for openConnectPopup() */
export interface ConnectPopupOptions {
  /** The connect URL returned by client.accounts.connect() */
  connectUrl: string;
  /** Popup width in pixels (default: 500) */
  width?: number;
  /** Popup height in pixels (default: 700) */
  height?: number;
  /** Called when the OAuth flow succeeds */
  onSuccess?: (result: ConnectPopupResult) => void;
  /** Called when the OAuth flow fails */
  onError?: (error: Error) => void;
}

/** Resolved value of the openConnectPopup() promise */
export interface ConnectPopupResult {
  status: "success";
  provider: string;
  accountId: string;
}

/** Options for handleConnectCallback() */
export interface ConnectCallbackOptions {
  /** Target origin for postMessage (default: "*") */
  targetOrigin?: string;
  /** Whether to auto-close the window after posting (default: true) */
  autoClose?: boolean;
}
