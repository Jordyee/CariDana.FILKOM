# AI Coding Prompt

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- `docs/ai-native/17-agent-action-log.md`
- `package.json`
- GitHub Issue #10 (`T005`)

You are working on Issue #10 / T005: Add order and independent-state migrations.

## Goal

Add only the next sequential D1 migration after published `0001` and `0002`
for immutable order IDs, constrained source type, mode-specific order data, and
separate order/payment/fulfillment/remittance state histories. The migration
must not collapse those axes into one status or store proof binaries.

## Relevant Context

- FR-019 and SC-002 require one immutable, unique internal Order ID and an
  explicit `manual` or `form_sync` source type. A manual order has no Sheet row
  identity; T007 owns the Sheet-link ledger.
- FR-024--FR-029 require separate histories, actor/time, mode-specific data,
  integer rupiah amounts, and no cross-axis update inference. FR-032 permits
  Drive-reference metadata only, never binary proof content.
- Campus records may use pickup point/PIC without regional delivery fields;
  regional records require area, contact/address, and PIC. Existing T004
  activity configuration is the authoritative mode boundary.
- The clarification log explicitly requires an owner decision before T005--T007
  on retention and on payment/refund/remittance semantics that affect
  persistence. This is a hard stop, not an implementation detail.

## Files to Inspect First

- `migrations/0001_identity_sessions.sql`
- `migrations/0002_committee_activities.sql`
- `migrations/README.md`
- `src/db/schema.ts`
- `test/db/identity-migration.spec.ts`
- `test/db/activity-migration.spec.ts`
- `test/env.d.ts` and `vitest.config.ts`

## Constraints

- The next migration must be sequential (expected `0003_orders_states.sql`);
  never modify published `0001` or `0002`.
- Use strict local D1/SQLite tables, foreign keys, `CHECK` constraints, and
  indexes that support activity/order ID, assigned PIC, and state retrieval.
- Use synthetic test data and disposable local Miniflare D1 only. Keep runtime
  Wrangler bindings ASSETS-only.
- Preserve T002 privacy guardrails: no real buyer data, proof/map links,
  credentials, external IDs, remote D1, Sheet access, Drive access, or binary/
  BLOB proof column.
- Migration tests must cover fresh schema, upgrade from T004, repeat/no-op,
  failed disposable migration rollback/retry, raw invalid insert/update,
  constrained source/state/money types, cross-mode invalid records, and
  independent latest-state/actor retrieval.

## Do Not

- Do not implement routes, authorization, UI, Sheet synchronization/link
  ledger, Drive integration, idempotency service, corrections, refunds,
  approval workflow, reconciliation calculations, remote migration, or
  deployment.
- Do not invent a retention/deletion rule, payment/refund representation, or
  remittance aggregation/settlement rule. Do not start T006 or later work.

## Approved Persistence Policy

The owner approved no automated P1 deletion of confirmed order, state-history,
or proof-reference metadata; it remains through closure/reporting. Payment and
PIC-remittance rows are append-only per-order non-negative integer-rupiah
events. Refunds, voids, and financial corrections remain approved T006 effects,
not negative or rewriting T005 events. A later retention change requires an
explicit owner amendment and a sequential migration.

## Expected Output After Approval

- One new order/state migration, internal D1 row types, updated migration
  contract notes, and a focused local migration suite.
- Constraint/index/history tests mapping every T005 acceptance criterion,
  including proof-column inventory and independent state retrieval.

## Verification

Run focused migration tests, then `npm ci`, `npm run check`, `npm test`,
`npm run verify`, `npm run build`, `npm audit --audit-level=high`,
`npm run scan:sensitive`, and `git diff --check`. Review the entire diff.

## Loop Handoff

Use `run-the-loop` with the changed files, review findings, and test evidence.
The approved policy above is binding for the build cycle.

## Before You Finish

- Summarize changed files and approved persistence assumptions.
- Explain how constraints preserve each independent state axis.
- Report verification evidence, no-proof-binary inspection, and remaining
  human gates.
