import { supyagent } from "@supyagent/sdk";

export const client = supyagent({ apiKey: process.env.SUPYAGENT_API_KEY! });

/**
 * Ensures a connected account exists for the given user.
 * Creates one if it doesn't exist, otherwise returns the existing one.
 */
export async function ensureAccount(userId: string, displayName?: string) {
  try {
    return await client.accounts.create({
      externalId: userId,
      displayName,
    });
  } catch {
    // Account already exists — look it up
    const { accounts } = await client.accounts.list();
    const existing = accounts.find((a) => a.externalId === userId);
    if (existing) return existing;
    throw new Error("Failed to create or find connected account");
  }
}
