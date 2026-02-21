import { describe, it, expect } from "vitest";
import {
  getEmailSummary,
  getCalendarSummary,
  getSlackSummary,
  getGithubSummary,
  getDriveSummary,
  getSearchSummary,
  getDocsSummary,
  getSheetsSummary,
  getSlidesSummary,
  getComputeSummary,
  getResendSummary,
  getInboxSummary,
  getDiscordSummary,
  getNotionSummary,
  getTwitterSummary,
  getTelegramSummary,
  getStripeSummary,
  getJiraSummary,
  getSalesforceSummary,
  getBrevoSummary,
  getCalendlySummary,
  getTwilioSummary,
  getLinkedinSummary,
  getGenericSummary,
  getSummary,
} from "../src/ui/summaries.js";

describe("getEmailSummary", () => {
  it("returns list summary for message array", () => {
    const result = getEmailSummary({ messages: [{ id: "1" }, { id: "2" }] }, "gmail_list_messages");
    expect(result.text).toBe("Listed 2 emails");
    expect(result.badge?.text).toBe("2");
  });

  it("returns send summary for send action", () => {
    const result = getEmailSummary({ to: "test@example.com" }, "gmail_send_email");
    expect(result.text).toBe("Sent email to test@example.com");
    expect(result.badge?.variant).toBe("success");
  });

  it("returns single email summary", () => {
    const result = getEmailSummary({ subject: "Hello World" }, "gmail_get_message");
    expect(result.text).toBe("Email: Hello World");
  });
});

describe("getCalendarSummary", () => {
  it("returns list summary for events", () => {
    const result = getCalendarSummary({ events: [{ id: "1" }, { id: "2" }, { id: "3" }] }, "calendar_list_events");
    expect(result.text).toBe("Listed 3 events");
  });

  it("returns create summary", () => {
    const result = getCalendarSummary({ summary: "Team standup" }, "calendar_create_event");
    expect(result.text).toBe("Created event: Team standup");
  });
});

describe("getSlackSummary", () => {
  it("returns channel list summary", () => {
    const result = getSlackSummary({ channels: [{ id: "1" }, { id: "2" }] }, "slack_list_channels");
    expect(result.text).toBe("Listed 2 channels");
  });

  it("returns send summary", () => {
    const result = getSlackSummary({ channel: "general" }, "slack_send_message");
    expect(result.text).toBe("Sent message to #general");
    expect(result.badge?.variant).toBe("success");
  });
});

describe("getGithubSummary", () => {
  it("returns list summary for issues array", () => {
    const result = getGithubSummary([{ title: "Bug" }, { title: "Feature" }], "github_list_issues");
    expect(result.text).toBe("Listed 2 issues");
  });

  it("returns PR summary when tool name contains pull", () => {
    const result = getGithubSummary([{ title: "PR1" }], "github_list_pull_requests");
    expect(result.text).toBe("Listed 1 pull requests");
  });

  it("returns single issue summary", () => {
    const result = getGithubSummary({ title: "Fix bug", number: 42 }, "github_get_issue");
    expect(result.text).toBe("Fix bug #42");
  });
});

describe("getDriveSummary", () => {
  it("returns list summary for files", () => {
    const result = getDriveSummary({ files: [{ id: "1" }, { id: "2" }] }, "drive_list_files");
    expect(result.text).toBe("Listed 2 files");
  });

  it("returns single file name", () => {
    const result = getDriveSummary({ name: "report.pdf" }, "drive_get_file");
    expect(result.text).toBe("report.pdf");
  });
});

describe("getSearchSummary", () => {
  it("returns result count", () => {
    const result = getSearchSummary({ results: [{ url: "a" }, { url: "b" }] });
    expect(result.text).toBe("Found 2 results");
  });
});

describe("getDocsSummary", () => {
  it("returns document title", () => {
    const result = getDocsSummary({ title: "Meeting Notes" });
    expect(result.text).toBe("Document: Meeting Notes");
  });
});

describe("getSheetsSummary", () => {
  it("returns cell update count", () => {
    const result = getSheetsSummary({ updatedCells: 15 });
    expect(result.text).toBe("Updated 15 cells");
  });

  it("returns spreadsheet title", () => {
    const result = getSheetsSummary({ title: "Budget 2025" });
    expect(result.text).toBe("Spreadsheet: Budget 2025");
  });
});

describe("getSlidesSummary", () => {
  it("returns presentation title with slide count", () => {
    const result = getSlidesSummary({ title: "Q4 Review", slides: [{}, {}, {}] });
    expect(result.text).toBe("Presentation: Q4 Review");
    expect(result.badge?.text).toBe("3");
  });
});

describe("getComputeSummary", () => {
  it("returns success for exit code 0", () => {
    const result = getComputeSummary({ exit_code: 0, stdout: "ok" });
    expect(result.text).toBe("Execution completed");
    expect(result.badge?.variant).toBe("success");
  });

  it("returns failure for non-zero exit code", () => {
    const result = getComputeSummary({ exit_code: 1 });
    expect(result.text).toBe("Execution failed");
    expect(result.badge?.variant).toBe("error");
  });
});

describe("getResendSummary", () => {
  it("returns send summary with recipient", () => {
    const result = getResendSummary({ to: "user@example.com" });
    expect(result.text).toBe("Sent email to user@example.com");
    expect(result.badge?.variant).toBe("success");
  });
});

describe("getInboxSummary", () => {
  it("returns event list summary", () => {
    const result = getInboxSummary({ events: [{}, {}, {}] });
    expect(result.text).toBe("Listed 3 notifications");
  });
});

describe("getDiscordSummary", () => {
  it("returns guild list summary", () => {
    const result = getDiscordSummary({ guilds: [{ id: "1" }, { id: "2" }] }, "discord_list_guilds");
    expect(result.text).toBe("Listed 2 servers");
  });

  it("returns channel list summary", () => {
    const result = getDiscordSummary({ channels: [{ id: "1" }] }, "discord_list_channels");
    expect(result.text).toBe("Listed 1 channels");
  });
});

describe("getNotionSummary", () => {
  it("returns page list summary from results", () => {
    const result = getNotionSummary({ results: [{}, {}] }, "notion_search_pages");
    expect(result.text).toBe("Listed 2 pages");
  });

  it("returns page title", () => {
    const result = getNotionSummary({ title: "My Notes" }, "notion_get_page");
    expect(result.text).toBe("Page: My Notes");
  });
});

describe("getTwitterSummary", () => {
  it("returns tweet list summary", () => {
    const result = getTwitterSummary({ tweets: [{ text: "a" }, { text: "b" }] });
    expect(result.text).toBe("Listed 2 tweets");
  });

  it("returns single tweet summary", () => {
    const result = getTwitterSummary({ text: "Hello", author_username: "user1" });
    expect(result.text).toBe("Tweet by @user1");
  });
});

describe("getTelegramSummary", () => {
  it("returns send summary", () => {
    const result = getTelegramSummary({ chat: { title: "My Group" } }, "telegram_send_message");
    expect(result.text).toBe("Sent message to My Group");
    expect(result.badge?.variant).toBe("success");
  });

  it("returns message list summary", () => {
    const result = getTelegramSummary({ messages: [{}, {}, {}] }, "telegram_list_messages");
    expect(result.text).toBe("3 messages");
  });
});

describe("getStripeSummary", () => {
  it("returns customer list summary", () => {
    const result = getStripeSummary({ data: [{ id: "cus_1" }, { id: "cus_2" }] }, "stripe_list_customers");
    expect(result.text).toBe("Listed 2 customers");
  });

  it("returns balance summary", () => {
    const result = getStripeSummary({ available: [{ amount: 5000, currency: "usd" }], pending: [] }, "stripe_get_balance");
    expect(result.text).toBe("Balance: 50.00 USD");
  });
});

describe("getJiraSummary", () => {
  it("returns issue list summary", () => {
    const result = getJiraSummary({ issues: [{}, {}] });
    expect(result.text).toBe("Listed 2 issues");
  });

  it("returns single issue summary", () => {
    const result = getJiraSummary({ key: "PROJ-42", fields: { summary: "Fix login bug" } });
    expect(result.text).toBe("PROJ-42: Fix login bug");
  });
});

describe("getSalesforceSummary", () => {
  it("returns contact list summary", () => {
    const result = getSalesforceSummary({ records: [{}, {}, {}] }, "salesforce_list_contacts");
    expect(result.text).toBe("Listed 3 contacts");
  });

  it("returns opportunity list summary", () => {
    const result = getSalesforceSummary({ records: [{}] }, "salesforce_list_opportunities");
    expect(result.text).toBe("Listed 1 opportunities");
  });
});

describe("getBrevoSummary", () => {
  it("returns contact list summary", () => {
    const result = getBrevoSummary({ contacts: [{}, {}] }, "brevo_list_contacts");
    expect(result.text).toBe("Listed 2 contacts");
  });

  it("returns send summary", () => {
    const result = getBrevoSummary({ to: "a@b.com" }, "brevo_send_email");
    expect(result.text).toBe("Sent email to a@b.com");
  });
});

describe("getCalendlySummary", () => {
  it("returns event list from collection", () => {
    const result = getCalendlySummary({ collection: [{ name: "e1", start_time: "2025-01-01" }, { name: "e2", start_time: "2025-01-02" }] });
    expect(result.text).toBe("Listed 2 events");
  });

  it("returns event type list when items have duration", () => {
    const result = getCalendlySummary({ collection: [{ name: "30 min", duration: 30 }] });
    expect(result.text).toBe("Listed 1 event types");
  });
});

describe("getTwilioSummary", () => {
  it("returns send summary", () => {
    const result = getTwilioSummary({ to: "+15551234567" }, "twilio_send_sms");
    expect(result.text).toBe("Sent SMS to +15551234567");
  });

  it("returns message list summary", () => {
    const result = getTwilioSummary({ messages: [{}, {}, {}] }, "twilio_list_messages");
    expect(result.text).toBe("Listed 3 messages");
  });
});

describe("getLinkedinSummary", () => {
  it("returns profile summary", () => {
    const result = getLinkedinSummary({ localizedFirstName: "John", localizedLastName: "Doe" });
    expect(result.text).toBe("Profile: John Doe");
  });

  it("returns post list summary", () => {
    const result = getLinkedinSummary({ posts: [{ text: "a" }, { text: "b" }] });
    expect(result.text).toBe("Listed 2 posts");
  });
});

describe("getGenericSummary", () => {
  it("humanizes tool name", () => {
    const result = getGenericSummary({}, "custom_do_something");
    expect(result.text).toBe("Do something");
  });
});

describe("getSummary", () => {
  it("dispatches to correct summary function", () => {
    const result = getSummary("email", { messages: [{}] }, "gmail_list_messages");
    expect(result.text).toBe("Listed 1 emails");
  });

  it("falls back to generic for unknown type", () => {
    const result = getSummary("unknown_type", {}, "unknown_do_stuff");
    expect(result.text).toBe("Do stuff");
  });
});
