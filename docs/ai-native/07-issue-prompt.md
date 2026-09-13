# Issue Coding Prompt — T009

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md` (US-001, FR-001/002, NFR-001–004)
- `docs/ai-native/04-architecture.md` (session/data-flow/security sections)
- `docs/ai-native/05-issues.md` (T003, T008–T013, gates and order)
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md` including the T008 decision
- `docs/ai-native/16-artifact-analysis.md` (H5)
- Session handoff, T008 action log/review, merged PR #54 and final audit comment
- GitHub Issue #14, package/configuration, Git state, identity schema/test wiring
- OWASP Session Management and CSRF Prevention guidance (2026-09-13)

## Goal

Implement T009 / Issue #14 only: opaque random server sessions, hash-only D1
storage, secure bounded cookies, session-bound CSRF, expiry/revocation, and
denial of normal access for forced-password-change sessions. Use the fresh
`codex/t009-session-security` branch at approved main `8eb9d47` (T008 PR #54).
Do not begin T010 or another Task ID.

## Owner-Approved Lifetime Policy

Approved by the owner on 2026-09-13: normal sessions expire after 8 hours
absolutely or 15 minutes without an authenticated, permitted request; restricted
forced-change sessions expire after 10 minutes. Activity never extends the
absolute deadline. No remember-me or automatic absolute renewal. A restricted
session cannot become normal when an account flag changes.

Logout revokes the current session; reset/deactivation revoke all sessions.
The lifetime hard stop is resolved. Bootstrap/delivery remains as approved in
T008. The owner explicitly authorized continuation through the engineering loop.
No deployment, real-data access or T010 implementation is authorized.

## Design for Review

- Generate at least 32 CSPRNG bytes per new session. Never adopt caller-supplied
  IDs or preauthentication cookies. SHA-256 hashes high-entropy session tokens;
  passwords retain T008 PBKDF2.
- Cookie: opaque token only, `__Host-` name, Secure, HttpOnly, SameSite=Lax,
  Path=/, no Domain, bounded Max-Age/Expires. Match clearing attributes and
  prevent caching of authentication responses.
- Focused repository/service resolves current active/reset state server-side.
  Atomic lifecycle changes must prevent concurrency from undoing revocation.
- Require an unpredictable session-bound CSRF token in a custom header for
  mutations and exact same-origin validation as defense in depth. Missing,
  invalid, cross-session or foreign-origin requests fail before mutation.
  Review the concrete construction; SameSite alone cannot pass Issue #14.
  Never put session/CSRF tokens in URLs, logs, snapshots or persistent client
  storage. Reference:
  [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern).
- Protected handling defaults to denial. Distinguish normal/restricted
  sessions; no broad auth-path exemption. Session-owned endpoints may include
  CSRF acquisition and POST logout. Issuance stays an internal service for
  T010; never expose test login or bootstrap endpoints.
- Provide transactional revocation primitives and synthetic reset/deactivation
  tests. Recovery/admin routes, counters, delivery, role policy and UI remain
  T010/T011/T013.

## Files to Inspect / Expected Output

- `src/auth/session.ts` and focused session repository/service
- `src/middleware/authenticate.ts`, `src/middleware/csrf.ts`
- `src/routes/auth.ts`, `src/app.ts`, `src/env.ts` as narrowly required
- `src/db/schema.ts`, `src/logging/redaction.ts`, T008 primitives
- `migrations/0001_identity_sessions.sql` (read-only), local D1 test harness
- `test/auth/session.integration.spec.ts`, Vitest configuration and bindings

Currently there is no product D1 binding or auth route. Use disposable local
test databases without real resource IDs. If approved idle/CSRF/restricted
policy needs persistence, add sequential `0006` with migration evidence.
Never edit published migrations `0001`–`0005`.

## Acceptance Mapping / Test-First Verification

| Acceptance | Required direct Worker evidence |
| --- | --- |
| Random bounded secure cookie | Flags, expiry/clearing, distinct tokens, no account/role data, fixation denial |
| Hash-only D1 | Digest equality and raw-token absence without secret assertion output |
| Logout/deactivation/reset/expiry/invalidation deny | Fake-clock exact boundaries, all-session revocation, replay, concurrency and rollback |
| Reviewed CSRF | Valid mutation; missing/malformed/invalid/cross-session/foreign/null-origin denials; no effects on denial |
| Private generic errors/logs | Safe authentication errors, cookie/header/token redaction, no raw exceptions or sensitive snapshots |
| Restricted/revoked/expired denial | Normal reads/mutations across five roles; account-flag change cannot promote restricted session |
| Middleware coverage | Production composition tests, test handlers absent from production, unknown API paths fail closed |

Start with focused failing Worker tests, then the smallest implementation.
Run `npm ci` if needed, focused auth/D1 tests, `npm run check`, `npm test`,
`npm run build` (dry run), `npm audit --audit-level=high`,
`npm run scan:sensitive`, and `git diff --check`. For migrations also run
`npm run verify` and fresh/upgrade/constraint/index/repeat/failure/rollback
checks. Use the four-attempt policy without weakening tests.

No UI change is planned. Same-origin browser cookie/CSRF judgment remains a
required review item. Identify local evidence as local; deployed-flow judgment
stays pending where deployment is not authorized. Do not claim completion or
merge through an unresolved issue-owned human gate. T012 CPU evidence remains.

## Constraints / Do Not

Use synthetic data, Worker Web APIs and the approved stack only. No dependency,
real account/credential, secret, Sheet/Drive access, remote D1, deployment,
release, direct-main edit or second Task ID. Preserve user changes. Do not
decide assignment, financial, bootstrap or password policy. Retain the approved
external credential-delivery boundary.

## Loop Handoff / Before You Finish

After the owner resolves lifetime policy, use `run-the-loop` with this prompt,
source requirements, changes and test evidence. Update loop/review artifacts
and the append-only ledger. Map every criterion to passing or pending evidence.
Report commands, failures, assumptions and risks. Commit/push/open/review/merge
only when all AGENTS.md gates pass. End this task at T009; do not start T010.
