# DropBot Setup Guide

## Quick Start

```bash
npm install
npm run seed    # creates admin + demo users + default plans
npm run dev     # starts at http://localhost:3000
```

## Test Credentials

| Role  | Email                     | Password     |
|-------|---------------------------|--------------|
| Admin | devappkavita@gmail.com    | password123  |
| Demo  | demo@dropbot.ai           | password123  |

- **Admin** has access to `/dashboard/admin` — user management, moderation, pricing editor, earnings
- **Demo** has a pre-built "Support Bot" ready to test embedding and chat

## Environment Variables

Copy `.env.example` to `.env` and fill values for features you need:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite path (default works) |
| `AUTH_SECRET` | Yes | Generate via `npx auth secret` |
| `AUTH_URL` | Yes | Local: `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth — [get here](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `OPENAI_API_KEY` | No | AI chatbot replies — [get here](https://platform.openai.com/api-keys) |
| `STRIPE_SECRET_KEY` | No | Payments — [get here](https://dashboard.stripe.com/test/apikeys) |
| `STRIPE_PRO_PRICE_ID` | No | Stripe price ID for Pro plan |
| `STRIPE_BUSINESS_PRICE_ID` | No | Stripe price ID for Business plan |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Local: `http://localhost:3000`, Prod: your Vercel domain |

## Features At a Glance

### Landing Page
- Hero with gradient text, stats counter, feature grid, testimonials, pricing section
- Pricing plans are stored in DB and editable via Admin → Pricing tab

### Auth
- Email/password login and registration
- Google OAuth (if configured)
- Role-based access: `admin` and `user`

### Dashboard
- Stats overview (chatbots, nodes, chats, plan)
- Chatbot CRUD with drag-and-drop builder
- Chat history viewer with per-session transcripts

### Builder
- 7 node types: Welcome, Message, Options, Input, Condition, API Call, End
- Drag-and-drop palette to canvas
- Click-to-connect edges (click source port → click target node)
- Snap-to-grid, pan via drag, zoom via Ctrl+scroll or buttons
- Settings panel (name, colors, welcome message, position)
- Live chat preview
- Status workflow: Draft → Submit for Review → Approved/Rejected

### Embed
Two methods to embed on any website:
```html
<!-- Script tag (recommended - Shadow DOM isolation) -->
<script src="https://your-domain.com/embed/CHATBOT_ID/widget"></script>

<!-- Iframe -->
<iframe src="https://your-domain.com/embed/CHATBOT_ID" width="100%" height="600" frameborder="0"></iframe>
```

### Payments (Stripe)
- Free / Pro ($29/mo) / Business ($99/mo) — limits enforced per plan
- Stripe Checkout for subscriptions
- Customer Portal for managing payment methods
- Admin sees earnings dashboard, transaction history, active subscriptions

### Admin Panel
Tabs: Dashboard, Users, Chatbots, Moderation, Pricing, Payments
- Dashboard: stats cards + charts (request volume, chatbot statuses)
- Users: searchable table, pagination, inline role editing
- Chatbots: all chatbots with status filter, inline approve/reject
- Moderation: approval queue for chatbots submitted for review
- Pricing: CRUD editor for plans (name, price, limits, features, Stripe price ID)
- Payments: transaction history

### Dark Mode
Toggle in navbar (landing) or sidebar (dashboard). Persisted in localStorage.

## Deploy to Vercel

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "your message"
   git push origin main
   ```

2. Import repo on [Vercel](https://vercel.com/new)
3. Set environment variables in Vercel dashboard:
   ```
   AUTH_SECRET=5c5a907432cc3d7258a6bf15c79d2435744b0dec1642e2613ee2cd84b606d2eb
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   AUTH_URL=https://your-domain.vercel.app
   ```
4. Vercel will auto-deploy on every push to main

## Tech Stack

- Next.js 16.2.9 (App Router, Turbopack)
- React 19, TypeScript
- Tailwind CSS v4
- Prisma + SQLite (swap to Postgres for production)
- NextAuth v5
- Zustand (state management)
- Recharts (admin charts)
- Stripe (payments)
- OpenAI (AI responses)
