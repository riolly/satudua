# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Vite + Convex concurrently)
pnpm dev

# Type checking and linting
pnpm lint

# Format code
pnpm format

# Unit tests (Convex functions with convex-test)
pnpm test              # watch mode
pnpm test:run          # single run

# E2E tests (requires dev server running)
pnpm test:e2e          # headless
pnpm test:e2e:ui       # interactive UI mode
pnpm test:e2e:headed   # visible browser

# Build
pnpm build
```

## Architecture

**Stack**: TanStack Start + Convex + Clerk + React Query + Tailwind CSS v4

### Frontend (src/)

- **Router**: TanStack Router with file-based routing in `src/routes/`
- **Data fetching**: Convex queries via `@convex-dev/react-query` bridge
  - Use `convexQuery(api.module.fn, args)` with `useSuspenseQuery()` for reactive data
  - Prefetch in route loaders with `context.queryClient.ensureQueryData()`
- **Mutations**: `useMutation(api.module.fn)` from `convex/react`
- **Auth**: Clerk with `ConvexProviderWithClerk` wrapper
- **UI components**: `src/components/ui/` (shadcn/base-ui style)

### Backend (convex/)

- **Schema**: `convex/schema.ts` using `defineSchema`/`defineTable`
- **Functions**: Queries (`query`) and mutations (`mutation`) with validators
- **API reference**: Auto-generated `api` object from `convex/_generated/api`
- Always include `args` and `returns` validators for all Convex functions
- Use `v.null()` for functions that don't return a value

### Testing

- **Unit tests**: `convex/**/*.test.ts` using `convex-test` + Vitest (edge-runtime)
  - Use `convexTest(schema, modules)` to create isolated test instances
- **E2E tests**: `e2e/*.spec.ts` using Playwright
  - Tests run serially against localhost:3001

## Convex Conventions

Follow the patterns in `.cursor/rules/convex_rules.mdc`:

- Use new function syntax with explicit `args`, `returns`, `handler`
- Use `ctx.db.query().withIndex()` instead of `.filter()`
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Index names should include all fields: `by_field1_and_field2`
