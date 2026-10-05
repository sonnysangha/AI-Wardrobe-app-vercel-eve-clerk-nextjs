<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working in this repo

Read `PLAN.md` first. It is the contract: routes, schema, function names, credit rules, ownership. If you need to deviate, say so in your final report.

## Sources of truth (read before writing code that touches them)

- Next.js 16: `node_modules/next/dist/docs/01-app/**` (proxy.ts, not middleware.ts; async `params`/`searchParams`; `loading.tsx`, `error.tsx`).
- Clerk 7: the installed packages are the source of truth — `node_modules/@clerk/nextjs/dist/types/**` (`auth()`, `auth.protect()`, `PricingTable`, `Protect`) and `node_modules/@clerk/backend/dist/**` (`verifyToken`, `createClerkClient().billing.getUserBillingSubscription()` and `BillingSubscription`), plus https://clerk.com/docs. There are no vendored Clerk skills in this repo.
- Convex 1.45: `docs/reference/convex_rules.txt` (function syntax, validators, indexes, actions), `docs/reference/convex_*.md`, `docs/reference/convex_workflow_component_README.md`.
- eve 0.56: `node_modules/eve/docs/README.md` index, then the pages it names.
- OpenAI SDK 7: `node_modules/openai/resources/images.d.ts` (edits accept `image: Uploadable | Uploadable[]`, `background`, `output_format`, `quality`; **`gpt-image-2` rejects `input_fidelity`** — never send it), `node_modules/openai/README.md`.
- shadcn: components live in `src/components/ui/`; add more with `pnpm dlx shadcn@latest add <name> -y` rather than hand-writing primitives.

## Things that differ from your training data (verified against the installed packages)

- **shadcn here is built on Base UI, not Radix.** There is no `asChild`. Compose with the `render` prop: `<Button render={<Link href="/x" />}>Label</Button>`, `<DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>`, `<SidebarMenuButton render={<Link href=… />}>`, `<TooltipTrigger render={…}>`. `TooltipProvider` takes `delay`, not `delayDuration`. Check the component file in `src/components/ui/` before guessing a prop.
- **Clerk 7:** the middleware file is `src/proxy.ts`; dark mode is `appearance={{ theme: dark }}` with `dark` from `@clerk/ui/themes` (already wired in `AppProviders`); `auth()` is async; billing components come from `@clerk/nextjs` (`PricingTable`, `Protect`).
- **Next 16:** `params`/`searchParams` are promises; route files can use the generated `PageProps<"/route">` / `LayoutProps<"/route">` types after `pnpm exec next typegen` (run it before `tsc` when you add routes).
- **OpenAI SDK 7:** `client.images.edit({ model: "gpt-image-2", image: [file, ...], prompt, size, quality, background, output_format })` — `image` accepts an array; wrap `Blob`s with `toFile(blob, name)` from `openai`. Never send `input_fidelity` to gpt-image-2.
- **Convex 1.45:** the lead runs a local anonymous deployment (`CONVEX_AGENT_MODE=anonymous npx convex dev --once` writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` into `.env.local`; nothing else runs until that has happened on this machine). `npx convex codegen --typecheck disable` regenerates `convex/_generated` once a deployment is configured. **Subagents do not run `npx convex dev`** — the lead pushes; validate with `npx tsc --noEmit -p convex/tsconfig.json` instead. `convex/schema.ts` is owned by the lead: if you need a field, say so in your report rather than editing it.
- **Dependencies:** everything needed is installed. Do not run `pnpm add` unless something is impossible without it, and list it in your report.

## What already exists (use it, don't rebuild it)

- `convex/shared/*` — enums, labels, credit costs, Clerk plans, limits, step keys (`stepLabel`), validators (`literals`, `vItemAttributes`, `vDetectedItem`, `vOutfitSlots`, …).
- `convex/lib/auth.ts` — `getCurrentUser`, `requireUser`, `requireAdmin`, `requireOnboarded`, `requireServiceUser({ serviceKey, clerkUserId })`, `assertOwner(doc, user, what)`.
- `convex/lib/errors.ts` — `appError(code, message, details?)`, `isAppError`, `ERROR_CODES`. `convex/lib/env.ts` — `requireEnv`, `optionalEnv`, `envNumber`.
- `convex/model/credits.ts` — `getBalance`, `reserve`, `refund`, `grantPlan`, `grantSignupBonus`, `adminAdjust`, `shortfallError`. Nothing else touches credits. Clerk is the only billing checkout; the legacy `pack` bucket holds welcome and existing non-expiring credits, not new purchases.
- `convex/model/jobs.ts` — `createJob`, `getJob`, `setWorkflowId`, `addSteps`, `setStep`, `appendResult`, `completeJob`, `listActive`, `countRunning`, `computeProgress`.
- `convex/model/users.ts` — `getByClerkId`, `upsertFromProfile`, `profileFromIdentity`, `roleFromClerkMetadata`.
- `convex/workflows/manager.ts` — the `workflow` manager (retries on by default, `maxParallelism: 8`).
- Public functions: `users.me/ensure/updatePrefs/completeOnboarding`, `credits.balance/quote/ledger`, `jobs.get/listActive/listRecent` (with `vJob` + `toJobView`).
- `src/lib/*` — `env`, `routes`, `format` (money, credits, dates, bytes, pluralize), `errors` (`toClientError`, `reportError`), `utils` (`cn`).
- `src/hooks/*` — `useCurrentUser`, `useBalance`, `useCreditQuote`, `useActiveJobs`, `useJob`, `useJobCompletionToasts`, `useIsMobile`.
- `src/components/common/*` — `PageHeader`, `EmptyState`, `ErrorAlert`, `LoadingGrid`/`LoadingRows`, `ConfirmDialog`, `JobStepper`, `ItemImage`, `CreditQuote`, `CreditBadge`.
- `src/components/layout/*` — `AppShell` (sidebar + topbar + onboarding gate), `nav-items.ts`.
- Route skeletons under `src/app/(app)/*/page.tsx` are placeholders for you to replace.

## Standards

**TypeScript.** `strict`, no `any`, no non-null `!` unless a comment says why. Named exports. Prefer `type` over `interface` for data shapes. Derive types from validators (`Infer<typeof v>`) and from `Doc<"table">` / `Id<"table">` in `convex/_generated/dataModel`.

**Files.** kebab-case filenames (`item-tile.tsx`, `use-credits.ts`), PascalCase components, one component per file unless tiny and private. Feature folders under `src/components/<feature>/`. Route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) stay thin: they compose feature components.

**Don't repeat yourself.** Before writing a helper, check `src/lib/`, `src/components/common/`, `src/hooks/`, `convex/lib/`, `convex/model/`, `convex/shared/`. Constants (credit costs, categories, limits, labels) live once in `convex/shared/*` and are imported everywhere, including the client and the agent. Formatting (money, dates, relative time, credits) goes through `src/lib/format.ts`.

**Convex.** New function syntax with `args` + `returns` validators on every function (see `convex_rules.txt`). Business logic goes in `convex/model/<table>.ts` as plain async functions taking `ctx` (`QueryCtx`/`MutationCtx`), and the exported `query`/`mutation`/`action` in `convex/<table>.ts` is a thin wrapper that validates args, calls `requireUser(ctx)` (or `requireAdmin` / `requireServiceKey`) and delegates. Never query by scanning; always use an index or search/vector index. Use `internalMutation`/`internalAction` for anything only workflows or webhooks call. Anything using Node libraries (`openai`, `pngjs`) lives in a file that starts with `"use node";` and only exports actions. Storage: upload via `generateUploadUrl`, read via `ctx.storage.getUrl` in queries (return `url` fields to the client, never raw storage ids for `<img src>`).

**Credits.** Only `convex/model/credits.ts` mutates `planCredits`, `packCredits` or `creditLedger`. Everything else calls `reserve`, `refund`, `grantPlan`, `getBalance`, `quote`.

**Auth scoping.** Every query/mutation resolves the current user via `requireUser(ctx)` and filters by `userId`. Never accept a `userId` from the client. Ownership is checked before any read of a doc by id (`assertOwner(doc, user)` in `convex/lib/auth.ts`).

**Frontend.** Server components by default; `"use client"` only where hooks or browser APIs are needed. Data via `useQuery` / `useMutation` / `useAction` from `convex/react` (and `usePaginatedQuery` for lists that can grow). `useQuery` returning `undefined` means loading: render the matching `*Skeleton`. Empty lists render `<EmptyState>` (from `components/common`) with one primary action. Errors: `toast.error(message)` from `sonner` plus an inline `Alert` where retry makes sense; catch `ConvexError` and show `error.data.message`. Mutations that change something the user is looking at use optimistic updates (`withOptimisticUpdate`) when the shape is simple. Forms use shadcn `Field`/`Input`/`Select` primitives with controlled state; no form library.

**Waiting states are product.** Anything that takes more than ~300 ms shows progress that is truthful: the job stepper for pipelines, a `Spinner` inside the button for mutations (`disabled` while pending), skeletons for initial loads, `Progress` for uploads. Never a blank screen, never a spinner with no label for more than a moment.

**Motion.** `motion/react` for list-entrance and layout transitions only (`layout`, `AnimatePresence`), durations ≤ 250 ms, respect `prefers-reduced-motion` via `useReducedMotion`.

**Design.** shadcn `base-nova` / neutral tokens; no custom colour tokens except `--credit`, `--success` and `--warning`, already defined in `globals.css`. Consistent page rhythm: `<PageHeader title description actions />` at the top of every app screen, content in `container`-width columns, 16px side gutter on phones. Cards for objects, not for everything. Dark mode must look intentional (test both).

**Env.** Client code imports `env` from `src/lib/env.ts` only. Convex functions read `process.env.X` behind a helper in `convex/lib/env.ts` that throws a clear error naming the missing variable.

**Errors.** Throw `appError("CODE", "human message", data?)` from `convex/lib/errors.ts` (wraps `ConvexError`). Codes are UPPER_SNAKE and listed in that file. Clients switch on `code`.

**Comments.** Only where the code can't say it (a business rule, a workaround with a link). No narrating comments.

**Scripts.** `pnpm dev` (Next + eve + you run `npx convex dev` separately), `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm convex:codegen`.

## Reporting back (for subagents)

End your work with: files you created/changed, any shared helpers you added or wished existed, any deviation from `PLAN.md`, anything left unfinished, and the exact commands you ran to verify (typecheck output included).

<!-- BEGIN:base44-dev-environment -->

## Base44 dev environment

The app runs via `docker compose -f docker-compose.base44.yml up -d` (Node 24 + pnpm, Next.js dev with Turbopack, Eve agent dev server). The compose bind-mounts the repo, installs deps with `pnpm install --frozen-lockfile`, and starts `pnpm exec next dev --hostname 0.0.0.0 --port 3000`.

**Required secrets (3 only):** `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — delivered via `/run/base44/app.env`. The Convex backend is already deployed and configured with matching Clerk development configuration; no AI/Gateway/agent keys are needed in this workspace.

**External services (cannot run locally):**
- **Clerk** — hosted auth. The proxy (`src/proxy.ts`) runs `clerkMiddleware()` on every request. Real Clerk keys are required — the app does not use `SKIP_ENV_VALIDATION`.
- **Convex** — hosted backend (database, file storage, realtime queries, workflows). The Next.js client connects via `NEXT_PUBLIC_CONVEX_URL`.
- **Vercel Eve** — AI agent, started automatically by `withEve` in `next.config.ts` alongside `next dev`. The stylist tools are optional for the wardrobe demo.

**Verify:** `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` returns 200 after the three secrets are in place.
<!-- END:base44-dev-environment -->
