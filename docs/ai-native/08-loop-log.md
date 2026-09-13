# Loop Log — Issue #12 / T007

## Sources Read

- `AGENTS.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/07-issue-prompt.md`

## Source of Truth

**Issue:** T007 / GitHub Issue #12 on
`codex/t007-sync-reports-migrations`, based on approved `main` merge commit
`2d93dd8` (PR #52).

**Goal:** Add structural, local-D1 persistence for safe Sheet connection
metadata, manual sync runs/row outcomes, explicit manual-match reviews,
retry-safe committed Sheet-to-order links, and report-version provenance.

**Acceptance criteria:**

- [ ] Sheet connections retain Sheet/tab identity and mapping version without a
  credential.
- [ ] Sync runs and row outcomes retain preview/commit status, source identity,
  import/link/skip/failure outcome, potential manual candidate, reviewer
  decision, actor/time, reason, and selected Order ID.
- [ ] A committed source identity links exactly once to one `form_sync` order
  or one explicitly reviewed existing `manual` order; partial-failure and
  write-back retries cannot create a second order or link.
- [ ] Report versions retain activity reference, generator/template versions,
  checksum, creator, and timestamp without a workbook/proof blob.
- [ ] Constraints and indexes support row retry, run result, and closed-report
  lookup.

**Constraints:** The next actual migration is `0005_sync_reports.sql`; the
backlog's illustrative `0006` filename is superseded by the verified current
`0001`--`0004` sequence. Use only synthetic local D1 data, strict tables,
foreign keys, constraints, indexes, and internal row types. Preserve immutable
existing migrations. The real Sheet remains inaccessible and write-disabled.

**Do not change:** routes, authorization, UI, Sheet/Drive APIs or credentials,
external resources, report generation/download, closure behavior, deployment,
T008+ logic, T005/T006 financial or idempotency semantics, real identifiers,
buyer/source-row payloads, proof references, or binaries.

## Loop Setup

**Prompt:** `docs/ai-native/07-issue-prompt.md`.

**Files to inspect first:** `migrations/README.md`, migrations `0001`--`0004`,
`src/db/schema.ts`, D1 test harness/bindings, and existing migration suites.

**Verification:** focused T007 and D1 regression suites; fresh/upgrade/repeat/
rollback migration behavior; `npm ci`; `npm run check`; `npm test`; `npm run
verify`; `npm run build`; `npm audit --audit-level=high`; `npm run
scan:sensitive`; `git diff --check`; and complete diff review.

**Loop limit:** AGENTS.md's four-attempt policy governs technical remediation;
this skill's review/test cycles stay focused on T007 only.

## Cycle Log

### Cycle 1 — accepted for PR review

**Build result:** Added `0005_sync_reports.sql`, internal D1 row types,
migration-contract notes, and six focused synthetic D1 tests. Connections store
only Sheet/tab identity and mapping version. Final preview/commit run records
and append-only source-row outcomes preserve safe retry evidence. A committed
source identity has exactly one `sheet_order_links` binding: imports select a
same-activity `form_sync` order; links select the explicitly reviewed existing
same-activity `manual` order. Report rows retain provenance only.

**Review result:** Pass. `09-code-review.md` maps the complete diff to T007,
US-004/US-011, FR-017--FR-023, FR-050--FR-052, and NFR-010/NFR-013/NFR-014/
NFR-026. No unrelated route, UI, dependency, external-integration, credential,
real-data, or published-migration change was found.

**Test result:** `npm ci` passed. Focused T007 migration tests passed 6/6;
all local D1 migration suites passed 139/139; complete Worker/privacy suite
passed 160/160 plus four Node privacy tests. `npm run check`, `npm run verify`,
dry-run ASSETS-only build, high-severity audit, sensitive scan (60 files, zero
findings), and `git diff --check` passed. Audit retains four moderate/no-high
advisories in existing pinned dependencies; no dependency changed.

**Remediation:** The initial test command found absent local dependencies, so
`npm ci` restored the locked toolchain. Attempt 1 gave the replay fixture a
unique row ID while retaining its original source identity. Attempt 2 measured
the shared disposable database's pre-existing ledger rows before asserting the
single new link. Attempt 3 updated prior global migration-lifecycle expectations
from `0004` to `0005`. Attempt 4 narrowed the nullable D1 count helper to zero
only for an empty result. All reruns passed; no test or product invariant was
weakened.

**Decision:** Accept for staging, Task-ID commit/push, and complete PR/CI
review. The owner approved the prompt and requested this controlled cycle on
2026-09-13.

## Stop Conditions

- [x] Every T007 acceptance criterion has automated or inspection evidence.
- [x] Fresh, upgrade, constraint, index, repeat/no-op, and failure/rollback
  migration checks pass.
- [x] The complete required local verification suite and sensitive scan pass.
- [x] Review has no unresolved scope, privacy, retry-safety, or migration defect.
- [x] No unrelated files changed and remaining external gates are documented.

## Final Student Explanation

I accepted this change because a Sheet source identity is immutable once
committed, while each safe retry outcome remains independently traceable. The
most important change is the D1 link trigger: it accepts a new `form_sync`
order only for an import and a `manual` order only with matching reviewer
evidence. The local migration, full test, privacy, build, audit, and review
evidence passed. Real Sheet/Drive integration and report generation remain
later human-gated work.
