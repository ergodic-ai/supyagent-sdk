/**
 * Normalize Microsoft API responses to match the Google formatter data shapes.
 * This lets us reuse EmailFormatter, CalendarEventFormatter, and DriveFileFormatter.
 */

function normalizeMailItem(msg: Record<string, unknown>): Record<string, unknown> {
  return {
    id: msg.id,
    subject: msg.subject,
    from: typeof msg.from === "object" && msg.from !== null
      ? (msg.from as any).emailAddress?.address || (msg.from as any).emailAddress?.name
      : msg.from,
    to: Array.isArray(msg.toRecipients)
      ? (msg.toRecipients as any[]).map((r) => r.emailAddress?.address || r.emailAddress?.name).join(", ")
      : msg.to,
    date: msg.receivedDateTime || msg.createdDateTime || msg.date,
    snippet: msg.bodyPreview || msg.snippet,
    body: typeof msg.body === "object" && msg.body !== null ? (msg.body as any).content : msg.body,
    hasAttachments: msg.hasAttachments,
  };
}

function normalizeCalendarItem(evt: Record<string, unknown>): Record<string, unknown> {
  const start = typeof evt.start === "object" && evt.start !== null
    ? { dateTime: (evt.start as any).dateTime || (evt.start as any).date, timeZone: (evt.start as any).timeZone }
    : evt.start;
  const end = typeof evt.end === "object" && evt.end !== null
    ? { dateTime: (evt.end as any).dateTime || (evt.end as any).date, timeZone: (evt.end as any).timeZone }
    : evt.end;

  return {
    id: evt.id,
    summary: evt.subject || evt.summary,
    start,
    end,
    location: typeof evt.location === "object" && evt.location !== null
      ? (evt.location as any).displayName
      : evt.location,
    attendees: Array.isArray(evt.attendees)
      ? (evt.attendees as any[]).map((a) => ({
          email: a.emailAddress?.address,
          displayName: a.emailAddress?.name,
          responseStatus: a.status?.response,
        }))
      : evt.attendees,
    status: evt.showAs || evt.status,
  };
}

function normalizeDriveItem(item: Record<string, unknown>): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    mimeType: item.file && typeof item.file === "object" ? (item.file as any).mimeType : item.mimeType,
    modifiedTime: item.lastModifiedDateTime || item.modifiedTime,
    size: item.size,
    webViewLink: item.webUrl || item.webViewLink,
    shared: item.shared !== undefined,
  };
}

function normalizeArray(items: unknown[], normalizer: (item: Record<string, unknown>) => Record<string, unknown>): unknown[] {
  return items.map((item) =>
    typeof item === "object" && item !== null ? normalizer(item as Record<string, unknown>) : item,
  );
}

export function normalizeMicrosoftMail(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  const d = data as Record<string, unknown>;

  // Array of messages
  if (Array.isArray(d.value)) {
    return { messages: normalizeArray(d.value, normalizeMailItem) };
  }
  if (Array.isArray(d.messages)) {
    return { messages: normalizeArray(d.messages, normalizeMailItem) };
  }
  // Single message
  if (d.subject || d.from || d.bodyPreview) {
    return normalizeMailItem(d);
  }
  return data;
}

export function normalizeMicrosoftCalendar(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.value)) {
    return { events: normalizeArray(d.value, normalizeCalendarItem) };
  }
  if (Array.isArray(d.events)) {
    return { events: normalizeArray(d.events, normalizeCalendarItem) };
  }
  if (d.subject || d.start) {
    return normalizeCalendarItem(d);
  }
  return data;
}

export function normalizeMicrosoftDrive(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.value)) {
    return { files: normalizeArray(d.value, normalizeDriveItem) };
  }
  if (Array.isArray(d.files)) {
    return { files: normalizeArray(d.files, normalizeDriveItem) };
  }
  if (d.name && (d.lastModifiedDateTime || d.webUrl)) {
    return normalizeDriveItem(d);
  }
  return data;
}
