# Loop Log — Issue #9 / T004

## Sources Read

- `AGENTS.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/07-issue-prompt.md` (read back after saving)
- `docs/ai-native/03-prd.md`, `04-architecture.md`,
  `14-project-constitution.md`, and `15-clarification-log.md`
- GitHub Issue #9 and the merged T003 handoff/action record

## Source of Truth

**Issue:** T004 / GitHub Issue #9, on `codex/t004-committee-activities` from
approved `14e7c98` (`main`).

**Goal:** Add only the second product migration for committee attribution and
one-product campus/regional activity planning data.

**Acceptance criteria:**

- [ ] Divisions and committee members have no login-account coupling.
- [ ] Every activity has one product and one constrained operating mode.
- [ ] Planning prices/costs are non-negative integer rupiah and quantity is a
  positive integer.
- [ ] Costs need a purpose; campus/regional configurations are exclusive; PIC
  attribution is active-only.
- [ ] Indexes cover activity status/period and division/active member lookup.

**Constraints:** `0001` is published and immutable; test only disposable local
D1; preserve synthetic/privacy guards, package pins, and ASSETS-only runtime.

**Do not change:** accounts/auth/bootstrap, PIC assignment scope, lifecycle
mutability, orders, calculations, UI, generic catalog/multi-tenancy, remote D1,
or external systems.

## Loop Setup

**Prompt:** `docs/ai-native/07-issue-prompt.md`.

**Files first inspected:** current migration and test harness, D1 type rows,
migration documentation, Worker test bindings, plus the required source docs.

**Verification:** focused local migration tests; `npm run check`, `npm test`,
`npm run verify`, `npm run build`, `npm audit --audit-level=high`,
`npm run scan:sensitive`, and complete diff review/check.

**Loop limit:** AGENTS.md's four-attempt policy controls any remediation;
otherwise one build/review/test cycle is preferred.

## Cycle Log

### Cycle 1 — implementation planned

**Build attempt:** add `0002_committee_activities.sql`, strict internal rows,
and a focused local D1 migration suite that keeps the existing lifecycle tests
valid across two ordered migrations.

**Review boundary:** no choice of post-activation edits or Member/PIC assignment
scope; only structural active-PIC integrity. Tests must cover inserts and
updates that bypass application code, prior-schema upgrade, no-op replay, and
disposable failure rollback/retry.

**Test result:** `npm ci` and focused tests pending.

**Decision:** continue under the owner-provided authorization. No criterion is
claimed complete until local gates, diff review, PR review/CI, merge verification
and final audit evidence pass.

## Stop Conditions

- [ ] All T004 acceptance criteria pass with test/inspection evidence.
- [ ] The full local verification suite and sensitive scan pass.
- [ ] No scope, privacy, migration, or human-decision issue remains.
- [ ] PR head/base, CI, comments and merge eligibility are reviewed.
- [ ] Merge commit and clean-main post-merge evidence are recorded.

## Explanation and Limitations

The schema can preserve controlled master data and reject invalid planning
records without granting login access or defining who may access an order. It
does not prove activity authorization, financial formulas, order validity, or
after-activation editing behavior. T016 owns the latter policy and T017 owns
the exact assignment boundary.

## Cycle 1 — accepted for PR review

**Build result:** Added the immutable sequential `0002` migration, internal D1
row types, T004 migration tests, and migration contract notes. The prior T003
lifecycle suite now first applies `0001`, inserts synthetic T003 rows, then
upgrades through `0002` and verifies two migration records/no-op replay.

**Review result:** Pass. The schema has no committee-to-account relationship,
uses one required product field and constrained activity mode, stores planning
inputs as strict bounded integers, and rejects blank/NUL cost purpose. Separate
configuration tables match the activity mode and reject a second/mismatched
mode. Active-only PIC triggers provide structural attribution integrity without
choosing T017 access scope or T016 lifecycle-edit rules.

**Test result:** `npm ci`, focused D1 tests (116), `npm run check`, `npm test`,
and `npm run verify` pass. The full suite has 137 Worker tests and four Node
privacy-scanner tests. `npm run build` passes with ASSETS-only dry-run binding;
`npm audit --audit-level=high` passes with four moderate advisories and no high;
`npm run scan:sensitive` reports 56 files and zero findings; `git diff --check`
passes.

**Decision:** Accept Cycle 1 for complete staged review and PR/CI gate. No
remediation attempt was needed. Pending only the reviewed PR head/base, CI,
merge and post-merge audit record.
