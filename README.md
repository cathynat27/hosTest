# Hoscover Staff Dashboard

Staff operations dashboard for monitoring and managing guest conversations in real time.

This is a Next.js 16 app used by hotel staff to:

- View active and escalated conversations
- Take over AI conversations
- Send manual replies
- Resolve completed conversations
- Receive live updates over Socket.IO

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Socket.IO client

## Prerequisites

- Node.js 20+
- npm 10+
- A running Hoscover backend API (for auth, conversations, and sockets)

## Environment Variables

Copy the example file and update values:

```bash
cp .env.example .env.local
```

Required:

- NEXT_PUBLIC_BACKEND_URL
: Base URL for the backend API and Socket.IO server (no trailing slash)

Optional:

- NEXT_PUBLIC_ENABLE_DEV_LOGIN
: Set to true only for local development/testing to show quick login buttons

Example:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-railway-service.up.railway.app
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
```

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open <http://localhost:3000>

## Available Scripts

- npm run dev
: Start development server

- npm run build
: Build production bundle

- npm run start
: Start production server from build output

- npm run lint
: Run ESLint checks

## Authentication

- Login sends credentials to /api/auth/login on the backend.
- JWT is stored in localStorage under key hoscover_jwt.
- Protected API requests include Authorization: Bearer [token value].
- A 401 response clears the token and redirects to /login.

## Real-Time Updates

- Socket.IO connects to NEXT_PUBLIC_BACKEND_URL.
- The client authenticates the socket using the same JWT token.
- Dashboard listens for conversation updates and escalation alerts.

## Deployment (Vercel + Railway)

### Required Vercel Environment Variables

- NEXT_PUBLIC_BACKEND_URL
: Full Railway backend origin, for example <https://hoscover-api-production.up.railway.app>

- NEXT_PUBLIC_ENABLE_DEV_LOGIN
: Must be false for production and staging deployments

### Railway Backend Assumptions

- CORS allows your deployed Vercel origin(s) for both HTTP and Socket.IO transports.
- The backend auth middleware accepts Authorization: Bearer [jwt value] for REST and socket auth.token for Socket.IO.
- The backend returns JSON for all success and error responses.
- Proxy/load balancer keeps WebSocket upgrades enabled.

### Post-Deploy Smoke Test (5 Minutes)

1. Open the deployed Vercel URL and sign in with a real staff account.
2. Verify the conversation list loads without refresh and escalated threads appear first.
3. Open one active conversation and confirm messages are visible.
4. Trigger a new inbound message from backend/test device and verify it appears live in list and detail view.
5. Take over an escalated conversation and verify status changes immediately to In Progress.
6. Send a reply and verify it appears instantly, then stays after backend acknowledgement.
7. Resolve the conversation and verify it is removed from the active list.
8. Force token expiry or revoke token server-side, then trigger any API call and verify automatic redirect to login.

## Production Safety Notes

- Keep NEXT_PUBLIC_ENABLE_DEV_LOGIN=false in production.
- Remove test users from lib/dev-logins.ts before go-live.

## Maintenance Notes

- Docs-only update used for PR validation.

## Project Structure

```text
app/
  page.tsx            # Redirects to /login or /dashboard
  login/page.tsx      # Staff sign in screen
  dashboard/page.tsx  # Conversation operations UI
lib/
  api.ts              # Backend API calls
  auth.ts             # Token storage and auth headers
  socket.ts           # Socket.IO lifecycle
  dev-logins.ts       # Test users for dev quick login
types/
  index.ts            # Shared TypeScript types
```
