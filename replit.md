# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## EverydayAI V2 — AI Agent SaaS Platform

Located at `artifacts/everydayai-v2/`. A Next.js 16 AI agent builder platform similar to Agentive.

### Tech Stack
- Next.js 16, TypeScript
- Clerk auth (keyless dev mode active; real keys needed for production)
- Prisma 7 + PostgreSQL (Neon)
- OpenAI Assistants API
- Tailwind + JetBrains Mono + Space Grotesk
- Orange `#ff5500` terminal aesthetic

### Architecture
- `app/(auth)/` — Clerk sign-in/sign-up pages
- `app/(dashboard)/` — Protected dashboard layout with sidebar
- `app/api/` — All API routes (all use `lib/ensure-user.ts` for auth)
- `lib/ensure-user.ts` — Auto-creates user in DB on first request if not found (fixes Clerk webhook missing issue)
- `lib/db.ts` — Prisma client with pg adapter
- `prisma/schema.prisma` — User, Agent, KnowledgeFile, Conversation models

### Completed Features
- Landing page
- Clerk authentication
- Sidebar navigation (dashboard, agents, knowledge, billing, settings)
- Dashboard with stats
- **Agents list page** — shows agent cards with status, Open Studio button, delete
- **Create Agent modal** — name, description, model selector, creates OpenAI Assistant + Vector Store
- **Agent Studio** (`/agents/[id]`) — full split-panel builder:
  - Header with status badge (draft/live), deploy + share + version buttons
  - Prompt tab: model selector, instructions textarea, prompt score indicator, save
  - Knowledge tab: upload/delete documents (sent to OpenAI Vector Store)
  - Tools tab: placeholder (Phase 3)
  - Live chat panel: test agent in real-time, token usage display, new chat button
  - Deploy modal: publish agent to live
  - Share panel: copy share link
  - Version history modal

### Env Vars Needed (add to Secrets)
- `DATABASE_URL` ✅ already set
- `CLERK_SECRET_KEY` — for production Clerk
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — for production Clerk
- `CLERK_WEBHOOK_SECRET` — for Clerk webhooks
- `PAYSTACK_SECRET_KEY` — for billing
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — for billing frontend

### Phase Roadmap
- Phase 1 ✅ — Fix "Failed to load agents", agents list page, create agent modal
- Phase 2 ✅ — Agent Studio (Prompt, Knowledge, Live Chat, Deploy, Share, Versions)
- Phase 3 ✅ — Tools system (webhooks/API tools with function calling), mobile responsive sidebar
- Phase 4 ✅ — Public chat page (/chat/[token]), floating widget embed script, iframe embed, embed modal in Studio
- Phase 5 ✅ — Templates gallery (10 system templates), save-as-template from agent cards, community templates, "use template" clones agent directly into Studio
- Phase 6 — Settings, Billing (Paystack), Knowledge base management page
