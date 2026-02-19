/** A chat summary for listing */
export interface ChatSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A message as stored in the database */
export interface StoredMessage {
  id: string;
  chatId: string;
  role: string;
  parts: string;
  metadata: string | null;
  createdAt: Date;
}

/** Chat persistence adapter interface */
export interface ChatAdapter {
  /** Save or update a chat with its messages (append-only) */
  saveChat(chatId: string, messages: UIMessageLike[]): Promise<void>;
  /** Load all messages for a chat */
  loadChat(chatId: string): Promise<UIMessageLike[]>;
  /** List all chats (summary only) */
  listChats(): Promise<ChatSummary[]>;
  /** Delete a chat and all its messages */
  deleteChat(chatId: string): Promise<void>;
}

/**
 * Minimal UIMessage-compatible interface.
 * Matches Vercel AI SDK's UIMessage shape without importing it directly.
 */
export interface UIMessageLike {
  id: string;
  role: string;
  parts: Array<{ type: string; [key: string]: unknown }>;
  metadata?: Record<string, unknown>;
}
