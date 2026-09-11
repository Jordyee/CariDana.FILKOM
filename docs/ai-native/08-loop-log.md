# Loop Log — Issue #8 / T003

## Sources Read

AGENTS.md; docs/ai-native/05-issues.md; saved 07-issue-prompt.md (read back),
PRD/architecture identity requirements, constitution and clarification log,
GitHub Issue #8, test/runtime configuration and existing T002 evidence.

## Source of Truth and Setup

Goal and acceptance matrix: 07-issue-prompt.md, T003 only. Branch
codex/t003-identity-sessions from approved c3b19c1. Owner authorized immediate
prompt/loop progression and reviewed eligible merge; no new artifact approval
pause. AGENTS.md's four meaningfully different remediation attempts supersede
the skill's default three cycles. Never weaken checks or decide pending policy.

## Cycle 1 — implementation underway

- Build: first product identity/session migration, typed rows, disposable D1
  migration tests and test-only bindings. No live D1 configuration or auth code.
- Review boundary: five roles, canonical username uniqueness, verifier metadata,
  flags/lock persistence, digest-only storage, timestamp/FK/uniqueness guards,
  lookup/revocation indexes, migration rollback/retry; preserve privacy guards.
- Verification: npm ci passed with four existing moderate advisories. Focused
  tests plus complete check/test/verify/build/audit/scan gates pending.
- Decision: continue under owner authority. No T003 criterion is claimed done.

## Stop Conditions

Every T003 acceptance row passes; full current diff reviewed; all required
local/CI checks pass; no unresolved T003 human gate; reviewed PR merge verified,
clean main synchronized and final audit posted. Then stop; do not start T004.

## Explanation and Limitations

This schema can retain individual account state and revoke stored session
references. It does not authenticate anyone, implement hashing, select final
security costs/TTL, provision credentials, or change Deputy administration.
Bootstrap and one-time delivery remain owner decisions before those behaviors
are implemented. SQL cannot prove binary input was produced by a secure hash;
that proof belongs to T008/T009. No UI or protected API changes in this issue.

## Cycle 1 / remediation attempt 1

Initial focused run: 80/82 passed. SQLite GLOB stopped at embedded NUL, allowing
an invalid username on insert/update. Hypothesis: explicit instr/char(0) guard
must reject the full text independently of GLOB. Added that guard to the draft
migration, which has only been applied to disposable test databases. Rerun:
82/82 passed; npm run check passed, including generated bindings. No test changed
or weakened. All other acceptance cases, including migration rollback, passed.

The stored login key is lowercase ASCII letters/digits/dot/underscore/hyphen;
noncanonical input is rejected at SQL rather than silently rewritten. Future
account/login services must normalize input before persistence/lookup. Version
is a positive integer with a nonempty JSON parameter object; algorithm-specific
validation belongs to T008. Timestamp bounds represent UTC epoch milliseconds,
not a chosen session TTL. No accounts are seeded and no permissions are assigned
by the migration beyond storing the five approved role values.

## Complete local verification and acceptance review

- npm ci: passed, pins preserved. npm run check: passed. npm run verify:
  passed; executes check and npm test with fresh disposable migration databases.
- npm test within verify: 103 Worker tests (82 migration cases) and four Node
  privacy scanner tests, all passed. No skipped or weakened tests.
- npm run build: passed, Vite plus Worker dry run; ASSETS is the only binding.
- npm audit --audit-level=high: passed, four existing moderate advisories remain.
- npm run scan:sensitive: passed, 54 files and zero findings, including source,
  config, SQL, test artifacts and both dry-run bundles. git diff --check: passed.
- Origin remains c3b19c1. Git name/email privately matched approved T002 author.
- Acceptance: account tests prove all five roles, flags/lock state, canonical
  uniqueness and version/parameter constraints. Session tests prove column
  inventory/binary storage, expiry/revocation, orphan/duplicate denial and scoped
  revocation. Raw inserts AND updates exercise invalid values. PRAGMA/query-plan
  inspection proves strict tables, FK integrity and indexed lookups/revocation.
  Separate databases prove fresh empty baseline, no seeded accounts, repeat/no-op,
  failed-DDL rollback/retry, failed-upgrade preservation and batch rollback.
- Review: no authentication service, password implementation, bootstrap/delivery
  decision, account-permission change, UI, order/activity schema, remote binding,
  real resource, dependency or privacy-boundary change. No T003 human gate is
  pending: Issue #8's gate applies before fixing bootstrap behavior, which is
  explicitly absent here. No mobile/direct protected-API behavior changed.
- Decision: locally accepted for PR review. Current remote head/base/CI/comments,
  merge, clean-main sync and final PR audit remain required before done.

## Explanation for the owner

The migration makes invalid account/session rows fail at the database boundary,
including raw SQL writes that bypass application checks. The key correction was
explicit NUL rejection, which ordinary SQLite pattern matching did not enforce.
The tests also prove failed multi-step writes leave the earlier state intact.
Future authentication must validate verifier algorithms/costs and issue/revoke
sessions correctly; these passing schema tests do not claim login is implemented.

## PR publication and handoff

Committed implementation 1d5c75d, pushed with upstream, opened PR #49 against
c3b19c1 with Closes #8. Initial remote review confirms our own non-draft PR,
reviewed head, unchanged base, mergeable state and no review/inline/general
comments. Verify run 34586384005 is in progress; no CI pass is claimed yet.
This bounded evidence commit records publication, acceptance and the compact
handoff. Recheck the complete final head/base, comments and CI after pushing it.
Final merge and clean-main evidence will close in the final PR audit comment.
