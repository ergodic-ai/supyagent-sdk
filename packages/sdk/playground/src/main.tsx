import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { ToolMessage } from "@/components/supyagent/tool-message";

/**
 * Helper to create a mock part that ToolMessage accepts.
 */
function makePart(toolName: string, data: unknown, args?: Record<string, unknown>) {
  // Matches AI SDK v6 ToolInvocationUIPart shape
  return {
    type: "tool-invocation" as const,
    toolInvocation: {
      toolCallId: `call_${toolName}_${Math.random().toString(36).slice(2, 8)}`,
      toolName,
      state: "result" as const,
      args: args ?? {},
      result: data,
    },
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SCENARIOS: Array<{ label: string; toolName: string; args?: Record<string, unknown>; data: unknown }> = [
  {
    label: "Gmail - List emails",
    toolName: "gmail_list_messages",
    args: { maxResults: 5, query: "is:unread" },
    data: {
      messages: [
        { id: "1", subject: "Weekly Team Digest", from: "team@company.com", to: "me@company.com", date: new Date(Date.now() - 7200000).toISOString(), snippet: "Here's what happened this week across all departments...", hasAttachments: true, labelIds: ["CATEGORY_UPDATES", "INBOX", "UNREAD"] },
        { id: "2", subject: "Invoice #4521 — Payment Received", from: "billing@stripe.com", to: "me@company.com", date: new Date(Date.now() - 86400000).toISOString(), snippet: "Your payment of $299.00 has been processed successfully.", labelIds: ["INBOX", "CATEGORY_PERSONAL"] },
        { id: "3", subject: "Meeting Tomorrow at 2pm", from: "boss@company.com", to: "me@company.com", date: new Date(Date.now() - 172800000).toISOString(), snippet: "Don't forget about our sync tomorrow. Agenda attached.", hasAttachments: true, labelIds: ["INBOX", "IMPORTANT"] },
      ],
    },
  },
  {
    label: "Gmail - Send email",
    toolName: "gmail_send_email",
    args: { to: "colleague@company.com", subject: "Quick update" },
    data: { to: "colleague@company.com", subject: "Quick update", id: "msg_123" },
  },
  {
    label: "Calendar - List events",
    toolName: "calendar_list_events",
    args: { timeMin: "2025-01-20T00:00:00Z" },
    data: {
      events: [
        { id: "1", summary: "Team Standup", start: { dateTime: new Date(Date.now() + 3600000).toISOString() }, end: { dateTime: new Date(Date.now() + 5400000).toISOString() }, attendees: [{ email: "alice@co.com", responseStatus: "accepted" }, { email: "bob@co.com", responseStatus: "tentative" }] },
        { id: "2", summary: "Product Review", start: { dateTime: new Date(Date.now() + 86400000).toISOString() }, end: { dateTime: new Date(Date.now() + 90000000).toISOString() }, location: "Conference Room B", attendees: [{ email: "pm@co.com", responseStatus: "accepted" }] },
      ],
    },
  },
  {
    label: "Slack - List channels",
    toolName: "slack_list_channels",
    data: {
      channels: [
        { id: "C01", name: "general", memberCount: 142 },
        { id: "C02", name: "engineering", memberCount: 38 },
        { id: "C03", name: "random", memberCount: 115 },
        { id: "C04", name: "product-updates", memberCount: 67 },
      ],
    },
  },
  {
    label: "Slack - Send message",
    toolName: "slack_send_message",
    args: { channel: "general", text: "Hello team!" },
    data: { ok: true, channel: "general", text: "Hello team!", ts: "1706000000.000100" },
  },
  {
    label: "GitHub - List issues",
    toolName: "github_list_issues",
    args: { repo: "supyagent/sdk", state: "open" },
    data: [
      { title: "Add collapsible tool results", number: 142, state: "open", html_url: "#", user: { login: "andre" }, created_at: new Date(Date.now() - 86400000).toISOString(), labels: [{ name: "enhancement", color: "a2eeef" }, { name: "ui", color: "7057ff" }] },
      { title: "Fix token refresh race condition", number: 138, state: "open", html_url: "#", user: { login: "contributor1" }, created_at: new Date(Date.now() - 604800000).toISOString(), labels: [{ name: "bug", color: "d73a4a" }] },
      { title: "Implement Microsoft normalizers", number: 135, state: "closed", merged: true, pull_request: {}, html_url: "#", user: { login: "andre" }, created_at: new Date(Date.now() - 1209600000).toISOString() },
    ],
  },
  {
    label: "Drive - List files",
    toolName: "drive_list_files",
    data: {
      files: [
        { id: "1", name: "Q4 Report.pdf", mimeType: "application/pdf", modifiedTime: new Date(Date.now() - 86400000).toISOString(), size: 2456789, shared: true },
        { id: "2", name: "Project Assets", mimeType: "application/vnd.google-apps.folder", modifiedTime: new Date(Date.now() - 172800000).toISOString() },
        { id: "3", name: "Budget 2025.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", modifiedTime: new Date(Date.now() - 604800000).toISOString(), size: 89234 },
      ],
    },
  },
  {
    label: "Search",
    toolName: "search_web",
    args: { query: "best practices AI SDK" },
    data: {
      results: [
        { title: "AI SDK Documentation", url: "https://sdk.vercel.ai/docs", snippet: "The AI SDK is the TypeScript toolkit designed to help developers build AI-powered applications..." },
        { title: "Building with Tool Calling", url: "https://sdk.vercel.ai/docs/ai-sdk-core/tools", snippet: "Learn how to use tool calling to extend your AI applications with custom functionality..." },
      ],
      answerBox: { title: "AI SDK", snippet: "A TypeScript toolkit for building AI applications with React and Next.js." },
    },
  },
  {
    label: "Compute",
    toolName: "compute_run_script",
    data: { stdout: "Hello from compute!\nProcessed 142 records in 1.3s\nAll checks passed.", stderr: "", exit_code: 0, duration_ms: 1340 },
  },
  {
    label: "Compute - Failed",
    toolName: "compute_run_script",
    data: { stdout: "", stderr: "TypeError: Cannot read properties of undefined (reading 'map')\n    at processData (/app/index.js:42:15)", exit_code: 1, duration_ms: 230 },
  },
  {
    label: "Resend - Send email",
    toolName: "resend_send_email",
    data: { id: "re_abc123", to: "user@example.com", from: "noreply@supyagent.com", subject: "Welcome to Supyagent", created_at: new Date().toISOString() },
  },
  {
    label: "HubSpot - List contacts",
    toolName: "hubspot_list_contacts",
    data: {
      contacts: [
        { id: "1", firstName: "Alice", lastName: "Johnson", email: "alice@bigcorp.com", phone: "+1 555-0101", company: "BigCorp Inc.", createdAt: "2025-01-15T10:00:00Z", updatedAt: "2025-01-20T14:30:00Z" },
        { id: "2", firstName: "Bob", lastName: "Smith", email: "bob@startup.io", company: "StartupIO", createdAt: "2025-01-10T08:00:00Z", updatedAt: "2025-01-18T11:00:00Z" },
      ],
      paging: null,
    },
  },
  {
    label: "Linear - List issues",
    toolName: "linear_list_issues",
    data: {
      nodes: [
        { id: "1", title: "Implement dark mode toggle", identifier: "ENG-142", state: { name: "In Progress", color: "#f2c94c", type: "started" }, priorityLabel: "High", priority: 2, assignee: { displayName: "Alice" }, url: "#" },
        { id: "2", title: "Fix mobile nav overflow", identifier: "ENG-138", state: { name: "Done", color: "#4cb782", type: "completed" }, priorityLabel: "Medium", priority: 3, assignee: { displayName: "Bob" }, url: "#" },
        { id: "3", title: "Add API rate limiting", identifier: "ENG-155", state: { name: "Backlog", color: "#bec2c8", type: "backlog" }, priorityLabel: "Low", priority: 4, url: "#" },
      ],
    },
  },
  {
    label: "Pipedrive - List deals",
    toolName: "pipedrive_list_deals",
    data: {
      deals: [
        { id: 1, title: "Enterprise License — Acme Corp", value: 45000, currency: "USD", status: "open", stage_name: "Negotiation", person_name: "Jane Doe", org_name: "Acme Corp" },
        { id: 2, title: "Annual Renewal — TechStart", value: 12000, currency: "USD", status: "won", stage_name: "Closed Won", person_name: "Mike Chen" },
      ],
      pagination: { start: 0, limit: 100, more_items_in_collection: false },
    },
  },
  {
    label: "Discord - List servers",
    toolName: "discord_list_guilds",
    data: {
      guilds: [
        { id: "1", name: "Supyagent Community", owner: true, member_count: 1243 },
        { id: "2", name: "AI Developers", owner: false, member_count: 8721 },
        { id: "3", name: "TypeScript Hub", owner: false, member_count: 15034 },
      ],
    },
  },
  {
    label: "Discord - List channels",
    toolName: "discord_list_channels",
    data: {
      channels: [
        { id: "1", name: "announcements", type: 0, member_count: 1243 },
        { id: "2", name: "general", type: 0, member_count: 892 },
        { id: "3", name: "help", type: 0, member_count: 456 },
      ],
    },
  },
  {
    label: "Notion - List pages",
    toolName: "notion_list_pages",
    data: {
      pages: [
        { id: "abc1", title: "Product Roadmap Q1 2025", url: "https://notion.so/abc1", lastEditedTime: new Date(Date.now() - 3600000).toISOString(), createdTime: "2025-01-01T00:00:00Z", parentType: "workspace" },
        { id: "abc2", title: "Engineering Onboarding Guide", url: "https://notion.so/abc2", lastEditedTime: new Date(Date.now() - 86400000).toISOString(), createdTime: "2025-01-05T00:00:00Z", parentType: "workspace" },
        { id: "abc3", title: "Meeting Notes — Sprint Review", url: "https://notion.so/abc3", lastEditedTime: new Date(Date.now() - 604800000).toISOString(), createdTime: "2025-01-10T00:00:00Z", parentType: "database" },
      ],
      hasMore: false,
    },
  },
  {
    label: "Twitter - List tweets",
    toolName: "twitter_list_tweets",
    data: {
      tweets: [
        { id: "1", text: "Just shipped our new collapsible tool results! Every integration now gets a clean summary bar with expand-to-detail. No more wall of JSON.", author_username: "supyagent", created_at: new Date(Date.now() - 3600000).toISOString(), public_metrics: { like_count: 42, retweet_count: 12, reply_count: 5 } },
        { id: "2", text: "The future of AI agents is tool-rich interfaces. Give your agent 50 tools and make every result beautiful.", author_username: "aidev", author: { username: "aidev", name: "AI Developer" }, created_at: new Date(Date.now() - 86400000).toISOString(), public_metrics: { like_count: 128, retweet_count: 34, reply_count: 18 } },
      ],
    },
  },
  {
    label: "Telegram - Messages",
    toolName: "telegram_get_messages",
    data: {
      messages: [
        { message_id: 1, text: "Hey, are we still on for the demo tomorrow?", from: { first_name: "Alex", last_name: "Kim" }, chat: { title: "Project Chat" }, date: Math.floor(Date.now() / 1000) - 3600 },
        { message_id: 2, text: "Yes! I'll share the staging link in a few hours.", from: { first_name: "Sam" }, chat: { title: "Project Chat" }, date: Math.floor(Date.now() / 1000) - 1800 },
      ],
    },
  },
  {
    label: "Stripe - List customers",
    toolName: "stripe_list_customers",
    data: {
      data: [
        { id: "cus_1", name: "Acme Corporation", email: "billing@acme.com" },
        { id: "cus_2", name: "Jane Developer", email: "jane@indie.dev" },
        { id: "cus_3", name: "StartupCo", email: "finance@startup.co" },
      ],
    },
  },
  {
    label: "Stripe - List invoices",
    toolName: "stripe_list_invoices",
    data: {
      data: [
        { id: "inv_1", number: "INV-0042", amount_due: 29900, currency: "usd", status: "paid", customer_name: "Acme Corp" },
        { id: "inv_2", number: "INV-0043", amount_due: 9900, currency: "usd", status: "open", customer_name: "Jane Developer" },
        { id: "inv_3", number: "INV-0041", amount_due: 49900, currency: "usd", status: "void", customer_name: "OldCo" },
      ],
    },
  },
  {
    label: "Stripe - Balance",
    toolName: "stripe_get_balance",
    data: {
      available: [{ amount: 1234500, currency: "usd" }],
      pending: [{ amount: 45600, currency: "usd" }],
    },
  },
  {
    label: "Jira - List issues",
    toolName: "jira_list_issues",
    data: {
      issues: [
        { key: "PROJ-42", id: "1", fields: { summary: "Users can't reset password on mobile", status: { name: "In Progress", statusCategory: { colorName: "yellow" } }, priority: { name: "High" }, assignee: { displayName: "Alice Chen" }, issuetype: { name: "Bug" } } },
        { key: "PROJ-43", id: "2", fields: { summary: "Add dark mode support", status: { name: "To Do", statusCategory: { colorName: "blue-gray" } }, priority: { name: "Medium" }, issuetype: { name: "Story" } } },
        { key: "PROJ-38", id: "3", fields: { summary: "Upgrade to React 19", status: { name: "Done", statusCategory: { colorName: "green" } }, priority: { name: "Low" }, assignee: { displayName: "Bob" }, issuetype: { name: "Task" } } },
      ],
    },
  },
  {
    label: "Salesforce - Contacts",
    toolName: "salesforce_list_contacts",
    data: {
      records: [
        { Id: "1", Name: "Sarah Connor", Title: "VP of Engineering", Email: "sarah@cyberdyne.com", Phone: "+1 555-0199", Account: { Name: "Cyberdyne Systems" } },
        { Id: "2", Name: "John Connor", Title: "CTO", Email: "john@resistance.io", Phone: "+1 555-0200", Account: { Name: "The Resistance" } },
      ],
    },
  },
  {
    label: "Salesforce - Opportunities",
    toolName: "salesforce_list_opportunities",
    data: {
      records: [
        { Id: "1", Name: "Enterprise Deal — Cyberdyne", Amount: 150000, StageName: "Negotiation", CloseDate: "2025-03-15", Probability: 75 },
        { Id: "2", Name: "Starter Plan — Resistance", Amount: 12000, StageName: "Closed Won", CloseDate: "2025-01-10", Probability: 100 },
      ],
    },
  },
  {
    label: "Brevo - Campaigns",
    toolName: "brevo_list_campaigns",
    data: {
      campaigns: [
        { id: 1, name: "January Newsletter", subject: "What's new in 2025", status: "sent", statistics: { globalStats: { sent: 4521, opened: 1832, clicked: 423 } } },
        { id: 2, name: "Product Launch", subject: "Introducing Supyagent v2", status: "draft" },
      ],
    },
  },
  {
    label: "Calendly - Events",
    toolName: "calendly_list_events",
    data: {
      collection: [
        { uri: "1", name: "Discovery Call with Acme", start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 88200000).toISOString(), status: "active", location: { type: "zoom", location: "https://zoom.us/j/123" } },
        { uri: "2", name: "Demo — StartupCo", start_time: new Date(Date.now() + 172800000).toISOString(), end_time: new Date(Date.now() + 174600000).toISOString(), status: "active" },
      ],
    },
  },
  {
    label: "Calendly - Event types",
    toolName: "calendly_list_event_types",
    data: {
      collection: [
        { uri: "1", name: "30 Minute Meeting", duration: 30, active: true, slug: "30min", description_plain: "A quick introductory call" },
        { uri: "2", name: "60 Minute Deep Dive", duration: 60, active: true, slug: "60min", description_plain: "Extended session for detailed discussions" },
        { uri: "3", name: "15 Minute Check-in", duration: 15, active: false, slug: "15min" },
      ],
    },
  },
  {
    label: "Twilio - Messages",
    toolName: "twilio_list_messages",
    data: {
      messages: [
        { sid: "SM1", from: "+15551234567", to: "+15559876543", body: "Your verification code is 482901", status: "delivered", direction: "outbound-api", date_sent: new Date(Date.now() - 300000).toISOString() },
        { sid: "SM2", from: "+15559876543", to: "+15551234567", body: "Thanks, got it!", status: "received", direction: "inbound", date_sent: new Date(Date.now() - 120000).toISOString() },
      ],
    },
  },
  {
    label: "LinkedIn - Profile",
    toolName: "linkedin_get_profile",
    data: { localizedFirstName: "Andre", localizedLastName: "Developer", headline: "Building AI tools for developers", vanityName: "andredev" },
  },
  {
    label: "LinkedIn - Posts",
    toolName: "linkedin_list_posts",
    data: {
      posts: [
        { id: "1", text: "Excited to announce our new SDK component library! Every tool result now gets a beautiful collapsible card.", created: { time: Date.now() - 86400000 } },
        { id: "2", text: "The best developer tools are the ones that make complex things look simple.", created: { time: Date.now() - 604800000 } },
      ],
    },
  },
  {
    label: "Microsoft Mail (normalized)",
    toolName: "microsoft_mail_list_messages",
    data: {
      value: [
        { id: "1", subject: "Quarterly Review", from: { emailAddress: { name: "Manager", address: "mgr@company.com" } }, bodyPreview: "Please review the attached quarterly report before Friday.", receivedDateTime: new Date(Date.now() - 7200000).toISOString(), hasAttachments: true },
        { id: "2", subject: "Team Lunch", from: { emailAddress: { name: "HR", address: "hr@company.com" } }, bodyPreview: "Let's get together for lunch this Thursday!", receivedDateTime: new Date(Date.now() - 86400000).toISOString() },
      ],
    },
  },
  {
    label: "Inbox - Notifications",
    toolName: "inbox_list_events",
    data: {
      events: [
        { id: "gmail_abc1", provider: "gmail", event_type: "email.received", status: "unread", summary: "Email from Alice: Can you review my PR?", payload: { from: "alice@company.com", subject: "Can you review my PR?", snippet: "Hey, I just pushed the changes. Could you take a look when you get a chance?" }, received_at: new Date(Date.now() - 1800000).toISOString() },
        { id: "slack_def2", provider: "slack", event_type: "message", status: "unread", summary: "Message from Bob in #engineering: Deploy looks good!", payload: { text: "Deploy looks good! All tests passing.", user_name: "Bob", channel_name: "engineering" }, received_at: new Date(Date.now() - 3600000).toISOString() },
        { id: "gmail_ghi3", provider: "gmail", event_type: "email.received", status: "read", summary: "Email from Stripe: Invoice #4521 paid", payload: { from: "billing@stripe.com", subject: "Invoice #4521 — Payment Received", snippet: "Your payment of $299.00 has been processed." }, received_at: new Date(Date.now() - 86400000).toISOString() },
      ],
      total: 3,
      has_more: false,
    },
  },
  // ── Multimodal: Image ──
  {
    label: "Image - Generated",
    toolName: "image_generate",
    args: { prompt: "A futuristic cityscape at sunset" },
    data: { image_url: "/media/generated-cityscape.jpg" },
  },
  {
    label: "Image - Generated (grid)",
    toolName: "image_generate",
    args: { prompt: "Product dashboard overview" },
    data: { image_url: "/media/generated-grid.jpeg" },
  },
  {
    label: "Image - Processing",
    toolName: "image_generate",
    args: { prompt: "An oil painting of a mountain lake" },
    data: { job_id: "job_img_abc123", status: "processing", poll_url: "https://api.example.com/poll/img_abc123" },
  },
  {
    label: "Image - Error",
    toolName: "image_generate",
    args: { prompt: "Something that fails" },
    data: { error: "Content policy violation: the prompt was flagged by the safety filter." },
  },
  // ── Multimodal: Audio (TTS) ──
  {
    label: "Audio - TTS Processing",
    toolName: "tts_generate_speech",
    args: { text: "Generating a long audiobook chapter...", voice: "nova" },
    data: { job_id: "job_tts_def456", status: "processing", poll_url: "https://api.example.com/poll/tts_def456" },
  },
  // ── Multimodal: Audio (STT) ──
  {
    label: "Audio - STT Transcription",
    toolName: "stt_transcribe",
    args: { audio_url: "https://example.com/meeting.mp3" },
    data: { result: { text: "Good morning everyone. Let's start with the sprint review. Alice, can you walk us through the progress on the dashboard redesign? We shipped the new sidebar component last Thursday and the metrics look promising — engagement is up 12% week over week.", tokens_used: 847 } },
  },
  {
    label: "Audio - STT Processing",
    toolName: "stt_transcribe",
    args: { audio_url: "https://example.com/long-recording.mp3" },
    data: { job_id: "job_stt_ghi789", status: "processing", poll_url: "https://api.example.com/poll/stt_ghi789" },
  },
  // ── Multimodal: Video ──
  {
    label: "Video - Generated",
    toolName: "video_generate",
    args: { prompt: "Supyagent product demo" },
    data: { result: { output: "/media/generated-video.mp4" } },
  },
  {
    label: "Video - Generation Processing",
    toolName: "video_generate",
    args: { prompt: "A cat playing piano" },
    data: { job_id: "job_vid_jkl012", status: "processing", poll_url: "https://api.example.com/poll/vid_jkl012", estimated_time_seconds: 120 },
  },
  {
    label: "Video - Understanding",
    toolName: "video_understand",
    args: { video_url: "https://example.com/product-demo.mp4", question: "What is being demonstrated?" },
    data: { answer: "The video shows a product demo of a task management application. The presenter walks through creating a new project, assigning team members, setting deadlines, and using the Kanban board view. Key features highlighted include drag-and-drop task reordering, real-time collaboration indicators, and an AI-powered priority suggestion system." },
  },
  // ── Multimodal: OCR ──
  {
    label: "OCR - Text extraction",
    toolName: "ocr_extract_text",
    args: { image_url: "https://example.com/receipt.jpg" },
    data: { text: "ACME GROCERY\n123 Main Street\nAnytown, USA 12345\n\nMilk 2%          $3.99\nBread Wheat      $4.49\nEggs Large       $5.29\nApples (3lb)     $6.99\n\nSubtotal        $20.76\nTax (8%)         $1.66\nTotal           $22.42\n\nVISA **** 4242\nThank you!", tokens_used: 312 },
  },
  // ── WhatsApp ──
  {
    label: "WhatsApp - Messages",
    toolName: "whatsapp_messages",
    data: {
      messages: [
        { id: "wamid_1", from: "+5511999887766", body: "Hi! Is the order ready for pickup?", timestamp: Math.floor(Date.now() / 1000) - 1800, type: "text", contact_name: "Maria Silva", status: "read" },
        { id: "wamid_2", from: "+5511999887766", body: "Great, I'll be there in 20 minutes.", timestamp: Math.floor(Date.now() / 1000) - 900, type: "text", contact_name: "Maria Silva", status: "delivered" },
        { id: "wamid_3", from: "+14155551234", body: "Can you send me the latest invoice?", timestamp: Math.floor(Date.now() / 1000) - 7200, type: "text", profile_name: "John Davis" },
      ],
    },
  },
  {
    label: "WhatsApp - Send message",
    toolName: "whatsapp_send_message",
    data: { id: "wamid_4", from: "+15551234567", to: "+5511999887766", body: "Your order #4521 is ready for pickup!", timestamp: Math.floor(Date.now() / 1000), type: "text", status: "sent" },
  },
  // ── Browser ──
  {
    label: "Browser - Visit page",
    toolName: "browser_visit",
    data: {
      url: "https://docs.supyagent.com/getting-started",
      title: "Getting Started - Supyagent Documentation",
      status: 200,
      content: "# Getting Started\n\nWelcome to Supyagent! This guide will walk you through setting up your first AI agent.\n\n## Installation\n\n```bash\nnpx create-supyagent-app my-agent\ncd my-agent\npnpm install\n```\n\n## Configuration\n\nCreate a `.env.local` file with your API keys...\n\n## Your First Agent\n\nThe default template includes a chat interface with tool calling support.",
      links: [
        { text: "API Reference", href: "https://docs.supyagent.com/api" },
        { text: "GitHub Repository", href: "https://github.com/supyagent/sdk" },
        { text: "Examples", href: "https://docs.supyagent.com/examples" },
      ],
    },
  },
  {
    label: "Browser - Screenshot",
    toolName: "browser_snapshot",
    data: {
      url: "https://supyagent.com",
      title: "Supyagent — AI Agent Platform",
      status: 200,
      screenshot_url: "/media/generated-grid.jpeg",
    },
  },
  {
    label: "Browser - Error page",
    toolName: "browser_visit",
    data: {
      url: "https://example.com/api/deprecated",
      title: "404 Not Found",
      status: 404,
      content: "The requested resource could not be found.",
    },
  },
  // ── Route-mapped providers (via apiCall) ──
  {
    label: "Database (→ Compute)",
    toolName: "apiCall",
    args: { path: "/api/v1/db/query", method: "POST", body: { sql: "SELECT * FROM users LIMIT 5" } },
    data: { stdout: "id | name       | email\n1  | Alice      | alice@example.com\n2  | Bob        | bob@example.com\n3  | Charlie    | charlie@example.com\n4  | Dana       | dana@example.com\n5  | Eve        | eve@example.com\n\n5 rows returned", exit_code: 0, duration_ms: 42 },
  },
  {
    label: "Files (→ Drive)",
    toolName: "apiCall",
    args: { path: "/api/v1/files/upload", method: "POST" },
    data: {
      files: [
        { id: "f_1", name: "report-2025-q4.pdf", mimeType: "application/pdf", modifiedTime: new Date(Date.now() - 60000).toISOString(), size: 1245678 },
      ],
    },
  },
  {
    label: "Radar (→ Search)",
    toolName: "apiCall",
    args: { path: "/api/v1/radar", method: "GET" },
    data: {
      results: [
        { title: "AI Agent Market Report 2025", url: "https://research.example.com/ai-agents-2025", snippet: "The AI agent market is projected to reach $47B by 2027, driven by enterprise adoption of autonomous workflows..." },
        { title: "Competitor Analysis: AgentKit vs Supyagent", url: "https://techblog.example.com/comparison", snippet: "A detailed comparison of the two leading AI agent frameworks for tool-rich applications..." },
      ],
    },
  },
  // ── View Image ──
  {
    label: "View Image - URL",
    toolName: "viewImage",
    args: { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800" },
    data: { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", displayed: true },
  },
  {
    label: "Generic - Unknown tool",
    toolName: "custom_unknown_tool",
    data: { message: "This falls back to JSON display", items: [1, 2, 3], nested: { key: "value" } },
  },
];

// ─── App ──────────────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = useState(true);
  return (
    <button
      type="button"
      onClick={() => {
        setDark(!dark);
        document.documentElement.classList.toggle("dark");
      }}
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

function ToolCard({ scenario }: { scenario: typeof MOCK_SCENARIOS[0] }) {
  return (
    <ToolMessage
      part={makePart(scenario.toolName, scenario.data, scenario.args)}
    />
  );
}

function App() {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? MOCK_SCENARIOS.filter(
        (s) =>
          s.label.toLowerCase().includes(filter.toLowerCase()) ||
          s.toolName.toLowerCase().includes(filter.toLowerCase()),
      )
    : MOCK_SCENARIOS;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Supyagent SDK Playground
            </h1>
            <p className="text-xs text-muted-foreground">
              {MOCK_SCENARIOS.length} tool result scenarios
            </p>
          </div>
          <ThemeToggle />
        </div>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or tool..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />

        <div className="space-y-6">
          {filtered.map((scenario) => (
            <div key={scenario.label}>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {scenario.label}
              </p>
              <ToolCard scenario={scenario} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No matching scenarios
          </p>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
