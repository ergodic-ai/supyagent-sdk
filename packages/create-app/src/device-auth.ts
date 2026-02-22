import * as p from "@clack/prompts";
import pc from "picocolors";
import { exec } from "node:child_process";
import { platform } from "node:os";

const SUPYAGENT_API_URL = "https://app.supyagent.com";

function openBrowser(url: string): void {
  const cmd =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} ${JSON.stringify(url)}`);
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

/**
 * Authenticate via the device code flow (RFC 8628).
 *
 * 1. Request a device code from the Supyagent API
 * 2. Open the browser for the user to approve
 * 3. Poll until approved, denied, or expired
 *
 * Returns the API key on success, or null on failure.
 */
export async function loginViaBrowser(): Promise<string | null> {
  const s = p.spinner();

  // 1. Request device code
  let deviceCode: DeviceCodeResponse;
  try {
    const res = await fetch(`${SUPYAGENT_API_URL}/api/v1/auth/device/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      p.log.error("Failed to start browser login. Please enter your API key manually.");
      return null;
    }
    deviceCode = (await res.json()) as DeviceCodeResponse;
  } catch {
    p.log.error("Could not reach Supyagent. Please enter your API key manually.");
    return null;
  }

  // 2. Open browser and show code
  p.log.step(
    `Opening browser to ${pc.cyan(deviceCode.verification_uri)}\n` +
      `  Enter code: ${pc.bold(pc.cyan(deviceCode.user_code))}`,
  );
  openBrowser(deviceCode.verification_uri);

  // 3. Poll for approval
  s.start("Waiting for approval in your browser...");

  const interval = (deviceCode.interval || 5) * 1000;
  const deadline = Date.now() + deviceCode.expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));

    try {
      const res = await fetch(`${SUPYAGENT_API_URL}/api/v1/auth/device/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_code: deviceCode.device_code }),
      });

      if (res.ok) {
        const data = (await res.json()) as { api_key: string };
        s.stop(pc.green("Logged in successfully!"));
        return data.api_key;
      }

      if (res.status === 403) {
        s.stop(pc.red("Authorization denied."));
        return null;
      }

      if (res.status === 410) {
        s.stop(pc.red("Code expired. Please try again."));
        return null;
      }

      // 428 = still pending, keep polling
    } catch {
      // Network error — keep trying
    }
  }

  s.stop(pc.red("Timed out waiting for approval."));
  return null;
}
