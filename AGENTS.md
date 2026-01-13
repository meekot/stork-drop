# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Next.js routes (`page.tsx`, `parents/page.tsx`) and API handlers (`api/`).
- `components/` contains reusable UI pieces (e.g., `ItemCard.tsx`, `Button.tsx`, `WishlistApp.tsx`).
- `services/` contains client-side API helpers (e.g., `productService.ts`).
- `lib/` contains server-only helpers (e.g., `productParser.ts`).
- `types.ts` centralizes shared TypeScript types and enums.
- `metadata.json` stores app metadata.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Next.js dev server with hot reload.
- `npm run build`: create a production build.
- `npm run start`: run the production server locally.
- `npm run lint`: run Next.js lint checks.

## Coding Style & Naming Conventions
- Language: TypeScript + React with functional components and hooks.
- Indentation: 2 spaces; keep semicolons and single quotes as in existing files.
- Naming: `PascalCase` for components and types, `camelCase` for functions/vars.
- File layout: UI components in `components/`, app logic in `App.tsx`, services in `services/`.
- No formatter/linter is configured; keep changes consistent with nearby code.

## Testing Guidelines
- No automated test framework is configured yet.
- If you add tests, consider `__tests__/` or `*.test.tsx` and update `package.json` scripts.
- Document how to run any new tests in this file.

## Commit & Pull Request Guidelines
- Git history shows Conventional Commit-style messages (e.g., `feat: ...`).
- Use short, imperative summaries; prefer `type: summary` (feat, fix, chore, docs).
- PRs should include: a clear description, steps to verify, and screenshots for UI changes.

## Configuration & Secrets
- Set `PARENT_ACCESS_CODE` (parents login) in `.env.local`.
- Do not commit secrets; keep local config out of git.
