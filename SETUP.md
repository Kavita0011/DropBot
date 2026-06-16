# DropBot Setup Guide

## Quick Start

```bash
npm install
npm run seed        # creates admin + demo users + default plans
npm run dev         # starts at http://localhost:3001
```

## Deploy to Vercel (with Neon PostgreSQL)

1. Push to GitHub normally
2. On Vercel, set **Build Command** to (replaces SQLite schema with PostgreSQL):
   ```
   npx prisma generate && npx prisma db push --accept-data-loss && next build
   ```
3. Set environment variables:
   ```
   DATABASE_URL=<your-neon-connection-string>
   AUTH_SECRET=<generated-secret>
   AUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

## First Run

After seeding, log in at `/login` with the credentials printed in your terminal.

- **Admin** has access to `/dashboard/admin` — user management, moderation, pricing editor, earnings
- **Demo** has a pre-built "Support Bot" ready to test embedding and chat

## Environment Variables

Copy `.env.example` to `.env` and fill values for features you need:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite for local (`file:./dev.db`); PostgreSQL for production |
| `AUTH_SECRET` | Yes | Generate via `npx auth secret` |
| `AUTH_URL` | Yes | Local: `http://localhost:3000` |
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
3. Set environment variables in Vercel dashboard (see table above — at minimum `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`)
4. Vercel will auto-deploy on every push to main

## Tech Stack

- Next.js 16.2.9 (App Router, Turbopack)
- React 19, TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL (Neon for serverless)
- NextAuth v5
- Zustand (state management)
- Recharts (admin charts)
- Stripe (payments)
- OpenAI (AI responses)
