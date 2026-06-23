# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **Bun** (`bun.lock`). The deployed README/Docker use Bun, but npm scripts work too.

```bash
bun install                 # install deps
bun dev                     # Next.js dev server (http://localhost:3000)
bun run build               # production build (output: 'standalone')
bun run lint                # ESLint (eslint-config-next)
bun run test                # Vitest (watch mode)
bunx vitest run             # run all tests once
bunx vitest run src/app/api/assets/__tests__/route.test.ts   # single test file
bunx vitest run -t "name"   # run a single test by name

bunx prisma migrate dev     # apply/create migrations (dev)
bunx prisma generate        # regenerate Prisma client after schema edits
bunx prisma studio          # DB browser

bun run scn:add <component> # add a shadcn/ui component
```

Tests run under Vitest + jsdom + Testing Library; `@` aliases `./src` (configured in both `vitest.config.ts` and `tsconfig.json`).

## Architecture

Next.js 16 (App Router, React 19, React Compiler enabled) + TypeScript, Prisma 7 on PostgreSQL, NextAuth v4. Despite the name "Vest AI", the app is a **personal management suite** with three largely independent feature domains plus an AI assistant layer. Note: much of the code, comments, and UI strings are in **Indonesian**.

### Three feature domains (App Router groups under `src/app/(protected)/`)

- **financial-overview** — expense/income/budget/transfer tracking. Core domain logic lives in `src/lib/actions/*` and `src/lib/services/*` (expenses, income, accounts, budgets, transfers). Categories are locale-aware (`src/lib/expenseCategories.ts`, `getExpenseCategories(t)`).
- **tracker** — investment/asset portfolio (stocks, crypto, gold, cash). Live prices via CoinGecko (`/api/price`); dashboard charts in `src/components/tracker/dashboard/`.
- **kuliah** — Indonesian academic tracker (semesters, courses/`MataKuliah`, class sessions/`SesiKuliah`, grades/`nilai`, and **UAS-prep** exam-prep that extracts text from uploaded PDF/DOCX and generates study material via LLM). Domain types are centralized in `src/lib/kuliah-types.ts`.

### API layer
All server logic is in route handlers under `src/app/api/**/route.ts`. The standard pattern:
1. `getServerSession(authOptions)` → reject with 401 if no `session.user.id`.
2. Delegate to a service/action in `src/lib/services` or `src/lib/actions`, scoping all queries by `userId`.
3. Return `NextResponse.json(...)`; errors are `console.error`'d and returned as 500.

Routes do not all share this — AI routes call providers directly. Follow the service-delegation pattern when adding CRUD endpoints.

### Auth
`src/lib/auth.ts` defines `authOptions`: Prisma adapter + Google OAuth + Credentials (bcrypt). **JWT session strategy** — role/`isActive`/`isBlocked` are re-read from the DB on `update` trigger or every 5 minutes, and a deactivated/blocked user has their token id cleared (effectively signed out). Route protection is client-side via `SessionWrapper` (`src/app/(protected)/layout.tsx` → `src/components/layout/session-wrapper.tsx`); there is **no `middleware.ts`**. A separate localStorage-based **guest mode** (`src/lib/guest-store.ts`, Zustand) lets unauthenticated users try the app; real sessions clear guest state.

### AI integration
Multi-provider, no single SDK. Models are configured in `src/app/api/data.ts` (`AI_MODELS`):
- **OpenRouter** via the `openai` SDK with `baseURL: https://openrouter.ai/api/v1` (`/api/ai-chat`, env `OPEN_ROUTER_API`).
- **Gemini** (`@google/genai`, env `GEMINI_API_KEY`) and **Groq** (`groq-sdk`, env `GROQ_API_KEY`) selected by the `provider` field on a model config.
Chat routes support streaming (`ReadableStream` of `text/event-stream`) gated by `modelConfig.streamable`. Document parsing for UAS-prep uses `pdf-parse`/`mammoth`, declared in `next.config.ts` `serverExternalPackages`.

### Database
`src/lib/prisma.ts` is the singleton client using `@prisma/adapter-pg` over a `pg` Pool (Supabase connection pooling), `globalThis`-cached outside production. `DATABASE_URL` is required. Schema is `prisma/schema.prisma` (postgresql); migrations in `prisma/migrations/`.

### i18n
Custom EN/ID system — **no external i18n library**. `src/lib/i18n/context.tsx` provides `LanguageProvider` + `useLanguage()` returning `{ locale, setLocale, t, dateLocale }`; strings live in `src/lib/i18n/en.ts` / `id.ts` (typed by `Translations`), persisted to localStorage. When adding UI text, add keys to **both** `en.ts` and `id.ts`.

### Notifications
Web Push (VAPID, `web-push`, subscriptions in `PushSubscription` model, `/api/push/subscribe`) and email (Resend, `src/lib/email.ts` + `email-templates.ts`). Setup details in `NOTIFICATION_SETUP.md`. A weekly-report endpoint exists at `/api/notifications/weekly-report` (cron-driven, `CRON_SECRET`).

### UI conventions
shadcn/ui (Radix primitives) in `src/components/ui/`, Tailwind v4 (PostCSS), `next-themes` dark mode, Recharts for charts, `sonner` for toasts, Zustand for client stores (guest, confirm dialog). PWA support via `src/components/pwa/` and a service worker.

## Notes
- The root `README.md` is largely auto-generated boilerplate and describes the app inaccurately (as a generic "AI investing assistant" with MIT license placeholders) — trust the code over it.
- Deployment is Docker (`output: 'standalone'`); env vars beyond `.env.example` include `VAPID_*`, `RESEND_API_KEY`, `CRON_SECRET`.
