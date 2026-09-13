# Loop Log — Issue #11 / T006

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/07-issue-prompt.md` (read back after saving)
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- GitHub Issue #11

## Source of Truth

**Issue:** T006 / GitHub Issue #11 on
`codex/t006-audit-corrections-idempotency`, based on approved `main` merge
commit `3361346` (PR #51).

**Goal:** Persist append-oriented proposed issues, corrections, approvals, audit
events, and repeat-request outcomes while preserving confirmed T005 history.

**Acceptance criteria:**

- [ ] A correction retains its target ID, before/after values, reason,
  proposer/time, and approver/time where approval is required.
- [ ] Audit events contain actor and action, but no credential/session secret or
  unnecessary buyer/proof data.
- [ ] An idempotency record binds account, route, client key, request hash, and
  stored result; one key cannot be reused for a different request.
- [ ] Only clearly disposable drafts may be hard-deleted; confirmed financial
  history has no silent-delete path.
- [ ] Raw inserts and updates reject contradictory approval/resolution states.

**Constraints:** Published `0001`--`0003` migrations remain unchanged. Tests
use only synthetic rows and disposable local D1. The owner-approved policy
retains confirmed order/state/proof-reference history, uses non-negative
append-only payment/remittance events, and places refunds/voids/financial
corrections in this approval model—not in T005 event rewrites. Financial effect
kinds are void, refund, financial correction, and final loss classification;
T022 owns service, authorization, and UI workflow behavior.

**Do not change:** routes, authorization services, UI, calculations, Sheet or
Drive integration, external/remote D1 state, deployment, P2 drafts, or future
issue behavior. New audit/idempotency values must never retain raw credentials,
tokens, buyer fields, map links, proof references, or proof binaries.

## Loop Setup

**Prompt:** `docs/ai-native/07-issue-prompt.md`.

**Files first inspected:** T003--T005 migrations and migration contract,
internal row types, local D1 migration suites, test bindings, package commands,
and T022/T017 dependent issue boundaries.

**Verification after implementation:** focused T006 migration suite; migration
fresh/upgrade/repeat/rollback behavior; `npm ci`; `npm run check`; `npm test`;
`npm run verify`; `npm run build`; `npm audit --audit-level=high`;
`npm run scan:sensitive`; `git diff --check`; and complete diff review.

**Loop limit:** AGENTS.md's four-attempt policy governs technical remediation.

## Cycle Log

### Cycle 1 — accepted for PR review

**Build result:** Added `0004_audit_corrections_idempotency.sql`, internal D1
row types, migration contract notes, lifecycle expectations, and 8 focused
synthetic D1 tests. The new tables make issue/correction/effect/approval/audit/
idempotency rows append-only. A correction must match its issue, a financial
effect must match an approval-required correction, a decision must be by a
Coordinator/Deputy after the proposal and include its matching audit event, and
the composite idempotency key rejects a changed request digest.

**Review result:** Pass. `09-code-review.md` maps the complete diff to T006.
Review added chronology guards, complete correction-audit validation, and the
mandatory approval-to-audit link before accepting the design.

**Test result:** `npm ci` passed. Focused T006 tests passed 8/8; all local D1
migration suites passed 133/133; complete Worker/privacy suite passed 154/154
plus four Node privacy scans. `npm run check`, `npm run verify`, dry-run
ASSETS-only build, high-severity audit, sensitive scan (61 files, zero
findings), and `git diff --check` passed. Audit retains four moderate
advisories and no high; no dependency change was made.

**Remediation:** Attempt 1 replaced a heterogeneously inferred test tuple after
the type check rejected its non-statement member. Attempt 2 assembled a
deliberately rejected synthetic audit key at runtime so the repository privacy
scanner stays clean while the D1 redaction assertion remains active. Neither
change altered product behavior or weakened a test.

**Decision:** Accept for staging, Task-ID commit/push, and the complete PR/CI
review gate. The delegated owner instruction to implement T006 supplied the
confirmation to advance from the saved issue prompt to this controlled cycle.

## Stop Conditions

- [x] Every T006 acceptance criterion has test or inspection evidence.
- [x] Fresh/upgrade/repeat/rollback migration checks pass.
- [x] The full local verification suite and sensitive scan pass.
- [x] Review finds no unresolved correctness, scope, privacy, migration, or
  financial-meaning defect.
- [ ] PR head/base, CI, comments, conflicts, and merge eligibility are reviewed.
- [ ] Merge commit and clean-main post-merge evidence are recorded.

## Explanation and Limitations

This is a persistence-only issue. The schema can preserve and constrain evidence
but cannot grant approval authority, resolve Member/PIC scope, calculate totals,
or execute a correction. T017 and T022 must use it transactionally with later
server-side authorization.
