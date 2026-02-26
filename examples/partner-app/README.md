# Partner Example App

A full-stack Next.js app demonstrating the **Supyagent Partner workflow**: authenticate users with NextAuth, create connected accounts, connect OAuth integrations, and chat with user-scoped tools.

## What this demonstrates

- **User authentication** via NextAuth v5 (Google + GitHub providers)
- **Connected accounts** — each authenticated user maps to a Supyagent connected account via `client.accounts.create()`
- **OAuth connect flow** — users connect integrations (Google, Slack, GitHub, etc.) using `openConnectPopup()` from `@supyagent/sdk/connect`
- **Scoped tools** — chat API uses `client.asAccount(userId)` so each user gets tools scoped to their own integrations
- **Persistent chat** — chat history stored in SQLite via Prisma

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all values:

| Variable | Where to get it |
|----------|----------------|
| `AUTH_SECRET` | Run `npx auth secret` |
| `GOOGLE_CLIENT_ID/SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GITHUB_CLIENT_ID/SECRET` | [GitHub Developer Settings](https://github.com/settings/developers) |
| `SUPYAGENT_API_KEY` | [app.supyagent.com](https://app.supyagent.com) |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys) |

### 3. Set up database

```bash
npx prisma db push
```

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## User flow

1. Visit `/` — redirects to `/login`
2. Sign in with Google or GitHub
3. Redirected to `/dashboard` — see overview with integration count
4. Navigate to **Integrations** — grid of provider cards
5. Click **Connect** on a provider — OAuth popup completes the flow
6. Navigate to **Chat** — send messages using your connected tools
7. AI uses tools scoped to your account's integrations

## Tech stack

- **Next.js 15** (App Router)
- **NextAuth v5** (Google + GitHub)
- **Tailwind v4** + shadcn-style CSS variables
- **Vercel AI SDK** + `@supyagent/sdk`
- **Prisma** + SQLite
