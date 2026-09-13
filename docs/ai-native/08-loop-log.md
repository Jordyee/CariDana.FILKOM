# Loop Log — T009 / Issue #14

## Sources Read

AGENTS.md, T009 in 05-issues.md, 07-issue-prompt.md, relevant PRD/architecture,
constitution, clarification log, T008 PR #54 and current repository state.

## Source of Truth

Implement only session security on codex/t009-session-security from 8eb9d47.
The owner approved 8-hour absolute / 15-minute idle normal sessions and
10-minute restricted sessions, and authorized continuation. Keep T010 login/
recovery and T011 role policy out of scope.

Acceptance: opaque secure bounded cookie; hash-only D1; CSRF denial including
cross-session; expiry/logout/deactivation/reset/invalidation; generic private
errors; restricted sessions cannot reach normal protected routes.

## Cycle 1 — in progress

Use 07-issue-prompt.md. Begin with failing direct Worker tests. Add a sequential
session-security migration, crypto/session service, focused repository,
middleware and session-owned routes. Test-only handlers stay out of production.
Do not attach real D1 resources or implement credential issuance endpoints.

Verification: focused auth/migration tests, check, test, verify, dry-run build,
high-severity audit, sensitive scan, full diff/security review. Local browser
evidence must not be described as deployed evidence. Deployed same-origin flow
judgment remains an explicit human/external item unless separately satisfied.

AGENTS.md's four-attempt policy overrides the skill's generic three-cycle limit.
Every failure and material action is appended to 17-agent-action-log.md.

## Before acceptance

Map each criterion to evidence; keep any external/human item pending.
Open a PR only after complete local verification and review. Merge only if
every applicable gate passes. Do not start T010.

## Cycle 1 result — technical pass, external acceptance pending

Implemented the session migration, crypto/service/repository, shared middleware,
CSRF/logout routes and local Chromium evidence harness. Final verify passes:
197 Worker tests and four Node privacy tests, with current types/bindings.
Dry-run build exited zero with process-local metrics disabled; audit has no
high findings and four pre-existing moderate findings. Local browser assertions
pass at both approved viewports. The privacy scan and diff check pass.

Attempt 1 adapted old migration/auth expectations to approved behavior. Attempt
2 fixed the browser-discovered logout-CSRF clearing of an absent cookie. The
first final build process was interrupted after producing its dry-run output;
a metrics-disabled rerun exited zero without source/config/dependency changes.

Review is recorded in 09-code-review.md and evidence in
docs/evidence/t009-session-security.md. Deployed same-origin human judgment is
still pending, so prepare a draft PR, retain Issue #14 open and do not merge or
start T010. No deployment or real-data action occurred.

## Owner resolution — 2026-09-14 WITA

The owner approved moving deployed same-origin cookie/CSRF judgment to the
mandatory T012 gate, allowing T009 acceptance/merge on reviewed local evidence.
Updated source issues, prompt, review, clarification and handoff accordingly.
The earlier pending-draft record describes the state before this decision.
No runtime/schema/test/dependency changes were needed. Final amended-head CI
and the PR merge checks must pass; T010 remains unstarted in this task.
