# AI Coding Prompt

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- GitHub Issue #9 (`T004`)

You are working on Issue #9 / T004: Add committee and activity migrations.

## Goal

Add the sequential `0002` D1 migration after published `0001_identity_sessions.sql`.
It must model a controlled division and committee-member master independent of
login accounts, plus a one-product, one-mode activity setup with integer-rupiah
planning values, optional purpose-backed costs, and mutually exclusive campus
or regional configuration.

## Relevant Context

- FR-010 requires committee/division data to remain separate from accounts.
- FR-012--FR-015 require exactly one product and a `campus` or `regional` mode;
  campus setup needs pickup point/PIC and regional setup needs area/PIC.
- FR-013 and NFR-011 require integer rupiah amounts; target quantity is positive
  and optional additional costs have a non-empty purpose.
- T004 establishes structural schema only. Authorization routes, assignment
  scope, activity lifecycle mutability, orders, Sheet/Drive behavior, UI, and
  calculations are owned by later issues.

## Files to Inspect First

- `migrations/0001_identity_sessions.sql`
- `migrations/README.md`
- `src/db/schema.ts`
- `test/db/identity-migration.spec.ts`
- `test/env.d.ts` and `vitest.config.ts`

## Constraints

- Create a new `migrations/0002_committee_activities.sql`; never edit `0001`.
- Use strict D1/SQLite tables, explicit foreign keys, integer constraints, and
  indexes for activity status/period plus division and active-member lookup.
- Require active committee members for campus/regional PIC attribution and
  prevent an attributed PIC from becoming inactive.
- Use synthetic test values only, local disposable Miniflare D1 only, and keep
  runtime Wrangler configuration ASSETS-only.
- Keep migration tests compatible with multiple ordered migrations: fresh,
  prior-version upgrade, repeat/no-op, and deliberate disposable failure/rollback
  must remain tested.

## Do Not

- Do not create accounts, bootstrap credentials, auth routes, orders, UI,
  generic catalog/multi-tenancy, remote D1 bindings, migrations, or deployment.
- Do not decide Member/PIC assignment scope (T017) or post-activation activity
  mutability (T016).
- Do not add financial calculations beyond storing their inputs.

## Expected Output

- New migration, internal D1 row types, focused migration tests, and concise
  migration documentation where needed.
- Constraint tests for negative/fractional values, empty purpose, wrong or
  duplicate configuration, FK failures, and inactive attribution on insert,
  update, and deactivation.

## Verification

Run focused migration tests, then `npm run check`, `npm test`, `npm run verify`,
`npm run build`, `npm audit --audit-level=high`, and `npm run scan:sensitive`.
Review the complete diff and run `git diff --check`.

## Loop Handoff

After the build attempt, use `run-the-loop` with changed files, review findings,
and test evidence. Limit the implementation loop to T004 only.

## Before You Finish

- Summarize changed files and assumptions.
- Explain why the constraints do not choose T016/T017 policy.
- Report verification results and any remaining human gates.
