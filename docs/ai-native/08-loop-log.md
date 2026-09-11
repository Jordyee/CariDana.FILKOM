# Loop Log — Issue #10 / T005

## Sources Read

- `AGENTS.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/07-issue-prompt.md` (read back after saving)
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- GitHub Issue #10 and the merged T004 handoff/action record

## Source of Truth

**Issue:** T005 / GitHub Issue #10 on `codex/t005-orders-states`, based on
approved `main` merge commit `807621d` (PR #50).

**Goal:** Persist immutable order IDs, mode-specific data, and four independent
state histories without denormalizing them into a single status.

**Acceptance criteria:**

- [ ] Unique immutable `orders.order_id` and constrained `manual`/`form_sync`
  source type.
- [ ] Manual orders have neither required nor fabricated Sheet identity; T007
  owns source uniqueness/linking.
- [ ] Separate constrained history tables retain state, actor, and timestamp
  for order, payment, fulfillment, and remittance.
- [ ] Collected/remitted values are integer rupiah and an update of one axis
  cannot update another.
- [ ] Campus/regional order requirements are mode-valid.
- [ ] Proof storage is metadata-only, with no binary/blob column.

**Constraints:** Published migrations `0001` and `0002` are immutable; only a
local disposable D1 may be used; all data is synthetic; runtime configuration
remains ASSETS-only; no routes, authorization, UI, Sheet/Drive integration,
remote D1, credentials, or later issue scope.

**Do not change:** the approved no-automatic-deletion, append-only,
non-negative-event policy; Sheet link ledger; audit/correction/approval/
idempotency design; or financial read-model rules. T006 owns refund, void, and
correction effects.

## Loop Setup

**Prompt:** `docs/ai-native/07-issue-prompt.md`.

**Files first inspected:** published migrations, migration contract, internal
D1 types, T003/T004 local migration tests, and Worker test configuration.

**Verification after approval:** focused T005 tests; `npm ci`; `npm run check`;
`npm test`; `npm run verify`; `npm run build`; `npm audit --audit-level=high`;
`npm run scan:sensitive`; full diff review/check.

**Loop limit:** AGENTS.md's four-attempt policy governs technical remediation.

## Cycle Log

### Cycle 0 — persistence gate discovered

**Build attempt:** None. No migration, schema type, runtime configuration, test,
or external system was changed.

**Review result:** Blocked. `15-clarification-log.md` says that minimum data
retention and exact financial/refund/remittance semantics must be decided before
T005--T007. The project rules identify an unresolved persistence-affecting
financial policy as a hard stop.

**Test result:** Not run because there is no permissible implementation diff.

**Decision:** Owner approved the recommended policy: no automated P1 deletion
of confirmed order/state/proof-reference metadata; per-order payment and
remittance histories are append-only non-negative rupiah events; refunds,
voids, and financial corrections are approved T006 effects. This releases the
T005 build cycle without expanding its scope.

### Cycle 1 — accepted for PR review

**Build result:** Added `0003_orders_states.sql`, internal order/history row
types, migration contract notes, and the focused local D1 suite. The migration
uses a unique immutable Order ID, no Sheet/source-row fields, no proof binary,
mode/PIC checks, separate append-only histories, and latest-history indexes.
The T003 lifecycle test now recognizes the third sequential migration.

**Review result:** Pass. `09-code-review.md` maps the full diff to T005 and
finds no out-of-scope route/UI/integration/dependency change, policy guess,
privacy leak, or unchecked critical behavior.

**Test result:** `npm ci` passed. Focused T005 suite passed 9/9; all three D1
migration suites passed 125/125; complete Worker/privacy suite passed 146/146
plus four Node privacy scans. `npm run check`, `npm run verify`, dry-run
ASSETS-only build, high-severity audit, sensitive scan (59 files, zero
findings), and `git diff --check` passed. Audit retains four moderate advisories
and no high; no dependency change was made.

**Decision:** Accept for staging, Task-ID commit/push, and the complete PR/CI
review gate. One scoped test-assertion remediation was needed; no product
behavior or migration redesign failed verification.

## Stop Conditions

- [x] Owner fixed the retention and financial/refund/remittance persistence
  policy on 2026-09-11 WITA.
- [x] Every T005 acceptance criterion has test or inspection evidence.
- [x] The full local verification suite and sensitive scan pass.
- [x] No migration, privacy, financial-meaning, or scope defect remains.
- [ ] PR head/base, CI, comments, conflicts, and merge eligibility are reviewed.
- [ ] Merge commit and clean-main post-merge evidence are recorded.

## Explanation and Limitations

The owner chose append-only, non-negative per-order financial events, with no
automatic P1 deletion of confirmed metadata. This lets the schema preserve
independent current-state retrieval without pretending refunds or corrections
are ordinary payment/remittance rows. T006 must add the approved effect model;
T007 must not add deletion behavior without another owner decision.
