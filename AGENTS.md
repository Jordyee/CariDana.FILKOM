# Project Agent Rules

## Scope

These rules apply to the entire CariDana.FILKOM repository. They govern every
AI agent that plans, implements, tests, reviews, commits, or pushes work. The
project owner delegates routine engineering execution, not product, financial,
privacy, security, or release judgment.

## Sources Read

- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- `package.json`

## Project Purpose

CariDana.FILKOM is a mobile-first internal web application for trustworthy
FILKOM Day fund-raising operations. It supports one product and one mode per
activity, safe manual or Google Form order intake, independent operational and
financial states, role-scoped access, reconciliation, audit, closure, and a
formula-backed Excel report.

Delivery is campus-first. Complete and review the campus workflow before adding
regional-specific behavior. Regional work remains part of P1. T040 weak-network
drafts remain deferred until the project owner explicitly promotes them.

## Source of Truth and Precedence

Before modifying code for an issue, read the issue in
`docs/ai-native/05-issues.md` plus the relevant requirements and architecture.
Use this precedence when instructions differ:

1. The project owner's latest explicit decision or approved amendment.
2. `docs/ai-native/14-project-constitution.md`, except where a later explicit
   owner amendment supersedes an older statement.
3. `docs/ai-native/03-prd.md`.
4. `docs/ai-native/04-architecture.md`.
5. `docs/ai-native/05-issues.md`.
6. Tests and existing code, which are evidence of current behavior but cannot
   silently override an approved requirement.

The 2026-09-02 campus-first, manual-order, Bahasa Indonesia, and WITA decisions
are approved amendments. If a conflict remains material after applying the
precedence above, stop and ask; do not choose the most convenient behavior.

## Approved Stack and Boundaries

- TypeScript, Hono, one Cloudflare Worker, a Vite-built static client, and D1.
- `write-excel-file@4.1.1` is the accepted workbook writer.
- Use Web-standard APIs in Worker code. Do not introduce SSR, microservices, an
  ORM, a second backend, or another storage service without owner approval.
- Keep routes thin. Put business rules in pure/testable domain modules and data
  access behind focused repositories or services.
- Use checked-in sequential SQL migrations. Never modify an already-applied
  migration to disguise a schema change.
- Store and calculate money as integer rupiah. Keep order, payment,
  fulfillment, and PIC-remittance states independent.
- The primary P1 UI language is Bahasa Indonesia. English is a later
  enhancement. Display operational time in WITA (`Asia/Makassar`) while storing
  unambiguous timestamps.
- Optimize for current stable Chromium and the approved 360x800 and 390x844
  mobile viewports without a desktop-table dependency.

## Autonomous Issue Loop

After these rules and the planning baseline are approved, the agent may execute
dependency-ready T001-T039 work without routine confirmation:

1. Confirm the working tree, branch, upstream state, and user-owned changes.
2. Select one dependency-ready issue according to the implementation order in
   `docs/ai-native/05-issues.md`. Never start T040 without explicit approval.
3. Restate the issue goal, requirements, acceptance criteria, likely files, and
   verification boundary before editing.
4. Inspect the relevant code and tests. Make the smallest change that satisfies
   the issue; do not implement later issues early.
5. Add or update tests for success, denial, edge, retry, and privacy behavior as
   required by the issue.
6. Run the narrowest relevant checks during development, then the complete
   required verification before declaring the issue done.
7. Review the diff for scope, clarity, security, privacy, migrations, accidental
   secrets, and unrelated edits. Fix findings within the attempt policy below.
8. Commit one reviewable Task-ID-scoped change and push the current task or
   milestone branch after checks pass.
9. Report what changed, commands/evidence, residual risks, and the next
   dependency-ready issue. Continue automatically unless a stop rule applies.

Do not mark an issue complete merely because code was written. Every acceptance
criterion needs test, inspection, or explicit external/human evidence.

## Continue, Block One Issue, or Stop the Loop

### Continue automatically

Continue when implementation choices are reversible, remain within the issue,
and are supported by the approved stack and artifacts. Ordinary compile, test,
lint, formatting, or local migration failures enter the four-attempt policy.

### Block only the current issue

Record the blocker and continue another dependency-ready issue only when all of
the following are true:

- The blocked issue has not left the shared branch or schema in a partial or
  unsafe state.
- The next issue does not depend directly or transitively on the blocked work.
- Continuing cannot bias a pending product decision or weaken a quality gate.
- The files do not overlap with unresolved user or agent work.

Examples include waiting for a sanitized Sheet target, Drive ACL evidence, or
Treasurer review while unrelated manual-campus work remains dependency-ready.
If every remaining issue is blocked, stop the whole loop.

### Hard stop: do not continue another issue

Stop the entire autonomous loop and ask the project owner when any of these
conditions occurs:

1. An implementation needs an unresolved product or policy decision, including
   Member/PIC assignment scope, post-activation activity mutability, first
   Coordinator bootstrap or credential delivery, minimum data retention, or
   financial/refund/remittance semantics not already fixed by the PRD.
2. The proposed solution changes product scope, a non-goal, stack,
   infrastructure, security parameters, privacy boundary, financial meaning,
   schema direction, or a mandatory gate.
3. Work would deploy to production, write to the real response Sheet, use real
   buyer/proof data, inspect or change real Drive membership, create paid
   resources, expose a secret, or authorize a release. Prior permission to push
   code is not permission for these actions.
4. A credential, personal datum, real proof/map link, sensitive financial value,
   or real external identifier appears in source, fixtures, logs, screenshots,
   exports, terminal output, or a proposed commit and cannot be safely contained
   immediately.
5. Authorization, auditability, idempotency, migration safety, independent state
   semantics, or closed-record integrity may be weakened to make a test pass.
6. Required source documents conflict materially, an acceptance criterion is
   impossible as written, or completing the issue requires silently changing
   another Task ID.
7. User-owned or concurrent changes overlap the issue and cannot be preserved
   without choosing which intent wins.
8. A destructive or history-rewriting action appears necessary, including
   force-push, hard reset, broad deletion, dropping a non-test database, or
   rewriting shared migrations.
9. Four meaningfully different remediation attempts fail for the same blocking
   defect or acceptance criterion.
10. No safe dependency-ready issue remains.
11. T019, T033, or T039 has just completed, as required by the milestone
    checkpoints below.

## Four-Attempt Policy

An attempt is one evidence-based remediation cycle: state a hypothesis, make a
meaningfully different scoped change, and rerun the relevant verification.
Blindly rerunning the same command or repeating the same fix is not a new
approach and must not be used to evade the limit.

- Attempts 1-3: diagnose, change, verify, and continue if the evidence improves.
- Attempt 4: make the final justified scoped remediation and run the relevant
  narrow and regression checks.
- If attempt 4 fails, make no fifth code/configuration attempt. Restore or leave
  the branch in the safest reviewable state without discarding user work, then
  hard-stop the autonomous loop.

The stop report must include the failed Task ID and acceptance criterion, four
hypotheses/changes/results, the smallest useful error excerpt, current branch
state, safe options, the agent's recommendation, and one specific question for
the owner. Never paste secrets or personal data into the report.

## Mandatory Milestone Checkpoints

- **After T019:** stop before T021. Present a sanitized campus operational demo
  covering manual order creation, search/detail, attribution, pickup/payment/
  fulfillment updates, role scope, mobile behavior, and known limitations. Wait
  for owner workflow acceptance or amendments.
- **After T033:** stop before T020. Present the complete sanitized campus
  order-to-reconciliation-to-closure-to-report loop. Wait for owner acceptance
  before regional-specific implementation.
- **After T039:** stop. Present traceability and release evidence. Only the
  project owner decides whether to merge/release/deploy or whether T040 should
  be promoted.

Issue-owned human gates such as T024, T025, T028, and T032 retain their own
acceptance requirements. A passed technical gate does not require extra
approval unless its issue says so; a failed gate blocks its dependants.

## Just-in-Time Human Decisions

Ask only when the answer is required for the next safe change. Provide evidence,
two or three concrete options when useful, a recommendation, consequences, and
one focused question. Do not ask the owner to choose library details that the
approved architecture delegates to engineering.

Known checkpoints include:

- T016: exact setup fields editable after activation/trusted orders.
- T017: exact Member/PIC assignment boundary.
- T003/T008-T013: first Coordinator bootstrap and one-time credential delivery
  before the relevant behavior is fixed.
- T005-T007 and finance work: retention and unresolved financial semantics only
  where they change persistence or calculations.
- T024: real private Drive ACL judgment by the owner; agents may prepare only a
  sanitized checklist.
- T025/T028: `Column 1`, sanitized duplicate-Sheet target, credential boundary,
  and proof acceptance. Real-Sheet writes remain disabled afterward until a
  separate explicit production decision.
- T032: Treasurer approval of the sanitized workbook template.
- Any production, release, paid-resource, or real-data action.

## Security, Privacy, and External Systems

- Use only clearly synthetic data. Never reproduce real buyer names, phone
  numbers, addresses, map links, proof links, Sheet contents, credentials, or
  source financial values in development artifacts.
- Never commit production Cloudflare/D1 resource IDs, new real external IDs,
  Google credentials, or session material. The already approved isolated
  compatibility-spike D1 identifier is historical evidence only: do not reuse
  it for product data, expose it through production configuration, or remove it
  casually before T001 isolates the spike. Treat terminal output and
  screenshots as artifacts subject to the same rule.
- Enforce every protected read and mutation server-side. UI hiding is never an
  authorization control.
- Members/PICs receive personal data only for approved assigned scope.
  Officers/Treasurers receive aggregate application data without buyer contact,
  address, map, or raw proof references.
- Manual orders use an immutable internal ID, explicit `manual` source type,
  and idempotency key; they never fabricate a Sheet row.
- A possible Form/manual match is a warning only. Only Coordinator/Deputy may
  explicitly link it or import it separately; record the decision and never
  auto-merge.
- Sheet sync is manual, header-driven, preview-first, and writes only the
  selected immutable ID into the `Order ID` cell. Keep `Column 1` ignored until
  defined or removed.
- Store only validated Drive reference metadata, never proof binaries. Do not
  infer that application roles grant Drive access.
- Redact credentials, PII, proof references, and sensitive financial values
  from logs, errors, snapshots, commits, PR text, and reports.

## Coding and Change Rules

- Preserve unrelated user changes and the existing dirty worktree. Never reset,
  revert, delete, or reformat unrelated work.
- Prefer the smallest readable implementation. Do not add speculative generic
  rule engines, frameworks, abstractions, dependencies, or configuration.
- Validate at service/domain boundaries and enforce critical invariants again
  with D1 constraints where appropriate.
- Make duplicate-prone writes idempotent and transaction-safe. A retry must not
  create a second order or financial effect.
- Confirmed records are voided/corrected with actor, time, reason, before/after,
  and approval where required. Only disposable drafts may be hard-deleted.
- Closed activities are read-only; reopening is out of P1.
- Keep accessibility in implementation, not as a late cosmetic pass: keyboard
  access, visible focus, programmatic names, labelled statuses, touch targets,
  field errors, and retained valid input are required.
- Do not remove, skip, weaken, or rewrite a failing test merely to obtain green
  output. Update a test only when approved behavior changed, and explain why.
- Do not publish GitHub issues, open/merge a PR, merge branches, tag a release,
  or deploy unless the owner separately requests that external action.

## Commands

Until T001 replaces the compatibility-spike scaffold, use the checked-in
commands and inspect `package.json` before assuming they remain current:

- Install: `npm ci`
- Type and binding checks: `npm run check`
- Tests: `npm test`
- Local migration plus checks/tests: `npm run verify`
- Worker dry-run build only: `npm run build`
- Dependency audit: `npm audit --audit-level=high`

Use `npm run db:migrate:local` only against the local disposable test database.
Do not run remote migration commands until T037, and then only against an
explicitly identified isolated non-production D1 database. Never reinterpret a
dry-run build as deployment authority.

## Verification Before Done

Before claiming an issue complete:

- Every acceptance criterion is mapped to passing automated, manual, or
  explicitly pending external evidence.
- Relevant focused tests pass, followed by `npm run check`, `npm test`,
  `npm run build`, and `npm audit --audit-level=high`; run `npm run verify` when
  local migrations are involved.
- New/changed migrations pass fresh, upgrade, constraint, index, repeat/no-op,
  and rollback/failure checks appropriate to the issue.
- Direct API denial tests cover affected roles and Member/PIC cross-scope cases.
- Money/state/idempotency behavior is tested independently from UI rendering.
- A diff review finds no unrelated changes, secret/PII leakage, debug routes,
  skipped tests, accidental real resource IDs, or unsupported dependencies.
- Mobile UI changes are checked at 360x800 and 390x844 plus keyboard/focus
  behavior using sanitized data.
- The commit message includes the Task ID. Push only after the branch is clean
  enough for review; do not force-push or merge.

If a required external or human item is pending, report the issue as blocked or
partially evidenced—not complete.

## Commit and Push Policy

- Use a dedicated `codex/` task or milestone branch based on the latest approved
  integrated baseline. Never implement directly on `main`.
- Prefer one coherent Task-ID-scoped commit per issue; use additional commits
  only when they make review or evidence materially clearer.
- Suggested messages: `feat(T017): add idempotent manual orders`,
  `test(T017): cover cross-scope order denial`, or
  `docs(T019): record campus milestone evidence`.
- Rebase/update only after inspecting divergence and preserving local/user
  work. Never force-push shared branches.
- Push passing issue commits so work is recoverable. Opening or merging PRs,
  deleting branches, publishing issues, tagging, releasing, and deploying still
  require an explicit owner request.

## Stop Report Format

When the loop stops, report concisely:

1. Current Task ID and branch/commit.
2. Completed work and passing evidence.
3. Exact stop rule and affected acceptance criterion.
4. Failure/risk evidence without sensitive values.
5. What independent work, if any, remains safe.
6. Two or three options and the recommended option.
7. One specific question the project owner must answer.

Do not conceal uncertainty, claim an unrun test passed, or call a blocked issue
complete.
