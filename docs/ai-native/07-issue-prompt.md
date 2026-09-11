# Issue Coding Prompt — T003

## Sources Read

- AGENTS.md; GitHub Issue #8 (including conditional bootstrap checkpoint).
- docs/ai-native/03-prd.md (US-001/002, FR-001–009, NFR-002/012/026),
  04-architecture.md (identity model, security, approved Deputy administration),
  05-issues.md (T003 and adjacent dependencies), 14-project-constitution.md,
  15-clarification-log.md; existing 07/08 artifacts and 17-agent-action-log.md.
- package.json, vitest.config.ts, wrangler.jsonc, test configuration and T002
  fixture/privacy guardrails; installed Cloudflare test-helper declarations.
- Cloudflare testing configuration and D1 test API documentation:
  https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/

## Goal and Context

Implement only Issue #8 / T003: D1 accounts, persistent lock state and hashed
session persistence. T001 and T002 are merged; base is c3b19c1 (PR #48).
Use existing clean branch codex/t003-identity-sessions. No product migrations
remain after T001, so use migrations/0001_identity_sessions.sql, not the
backlog's illustrative 0002 filename. Owner authorizes immediate prompt/loop
progression and eligible reviewed PR merge, then stop without starting T004.

## Files to Inspect First

Read the sources above, src/env.ts, test/worker.spec.ts, test/tsconfig.json,
.github/workflows/ci.yml and the actual installed migration-helper API.

## Constraints / Do Not

Only SQL, schema types, local D1 tests/configuration and scoped documentation.
Keep all dependency pins, runtime outbound-test denial and privacy gates.
Do not add auth routes, hashing code, default accounts, credentials, bootstrap,
activity/order tables, remote bindings, deployments, real data or releases.
Coordinator and Deputy account-administration approval is preserved; storing
a role does not implement or change authorization. Bootstrap/delivery decisions
remain deferred because this migration seeds no account and fixes no such flow.
Never edit an applied migration. Keep the action ledger append-only.

## Expected Output / Acceptance Mapping

| Criterion | Evidence |
| --- | --- |
| Accounts: normalized unique username, five roles, flags, versioned verifier parameters, failures and lock | Typed rows; valid role/state persistence; raw SQL duplicate, malformed and negative inserts/updates denied. |
| Sessions: hash only, bounded timestamps, account reference | Digest-only column inventory, binary storage, lifecycle bounds, orphan/duplicate denial. |
| Constraints reject invalid states | Raw SQL tests bypass all application validation, including null/type/fractional cases. |
| Lookup and revocation indexes | PRAGMA inspection and query plans for username, active hash lookup and account revocation. |
| Fresh migration | Apply checked-in SQL to empty disposable local D1; verify empty product tables, upgrade from T001's empty product baseline, repeat/no-op, failure rollback and safe retry. |

## Verification

npm ci; focused D1 tests; npm run check; npm test; npm run verify (executes local
migration tests); npm run build (dry run); npm audit --audit-level=high;
npm run scan:sensitive (source/config/artifacts/both bundles); git diff --check.
No mobile or protected API behavior changes; those checks apply in later issues.
Record exact test evidence and limitations, review full diff and current PR
head/base/comments/CI before merge. No gate is waived.

## Loop Handoff / Before You Finish

Read this saved file, then use run-the-loop and update 08-loop-log.md immediately
under explicit owner authorization. Four-attempt policy overrides the generic
skill's three-cycle default. Privately check Git identity; commit/push with T003;
open PR against main with Closes #8; merge only after complete review/gates.
Verify merge, fast-forward clean main, post final PR audit and compact T003
handoff. Do not start T004 or create the next implementation task.
