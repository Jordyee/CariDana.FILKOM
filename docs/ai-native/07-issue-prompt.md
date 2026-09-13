# AI Coding Prompt

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- `package.json`
- GitHub Issue #13 (`T008`)
- Current Git state at merged T007 baseline `98503c7`

You are working on GitHub Issue #13 / T008: Implement versioned password
hashing and credential primitives.

## Goal

Implement only Worker-native, salted, versioned PBKDF2-HMAC-SHA-256 password
verification and one-time credential primitives. They must never persist or log
plaintext passwords and must make forced password replacement possible after a
one-time credential is used.

## Owner-Approved Boundary

The owner approved this bounded implementation on 2026-09-13 WITA:

- The first Coordinator will later be provisioned through a one-time deployment
  bootstrap secret that is disabled after use. T008 must not implement that
  bootstrap path, handle a secret, create an account, or add a route/CLI.
- Temporary credentials are delivered outside the app through an owner-approved
  confidential channel. T008 provides no delivery transport and never logs or
  exposes the credential through an HTTP DTO.
- T008 may implement parameterized, versioned primitives and synthetic-test
  policies only. It must not fix a final production iteration count or other
  deployed PBKDF2 parameter; T012 owns deployed CPU evidence and the final
  policy.

## Relevant Context

- FR-001, FR-003, FR-007, FR-008, NFR-003, NFR-004, and AC-001 require local
  authenticated accounts, salted approved password verifiers, no plaintext
  storage/logging, a random one-time reset credential, forced replacement, and
  non-enumerating login behavior.
- The architecture selects Web Crypto PBKDF2-HMAC-SHA-256 with a
  cryptographically random per-account salt and versioned parameters as the
  Worker-native candidate; raw SHA-256 is prohibited.
- Verification must keep the same observable work shape for an existing and a
  nonexistent account, and a successful valid verification may request a
  parameter-version upgrade. Password/salt/verifier fields are internal only,
  never response DTOs or logs.
- The existing T003 `accounts` migration already stores internal password
  hash/salt/parameter fields and `must_change_password`; do not alter the
  published migration or introduce a credential-delivery transport.

## Files to Inspect First

- `migrations/0001_identity_sessions.sql`
- `src/db/schema.ts`
- `src/auth/` and `src/logging/` (if present)
- `test/db/identity-migration.spec.ts`
- `test/` Worker-runtime configuration and privacy scan

## Constraints

- Use Web-standard Worker APIs only: `crypto.subtle`, `crypto.getRandomValues`,
  `TextEncoder`, and byte-safe encoding helpers.
- Give each verifier a CSPRNG per-account salt and an explicit parameter
  version. Reject malformed/unsupported verifier metadata without falling back
  to raw SHA-256.
- Keep existing/nonexistent-account verification constant-shape, including a
  synthetic dummy-verifier path. Use a timing-safe byte comparison after both
  candidates are derived.
- A temporary credential must be random, one-time, absent from logs/DTOs/
  snapshots, and result in the existing forced-replacement marker after valid
  use. Its plaintext may exist only in a narrow in-memory handoff required by
  the owner-approved delivery boundary.
- Build only pure/auth-domain primitives and focused Worker tests. T009 owns
  sessions; T010 owns login throttling, reset lifecycle, and forced-change
  routes; T011--T012 own authorization and deployed CPU evidence.
- Use synthetic test credentials and canaries without exposing their literal
  secret values in snapshots, assertion messages, logs, or committed artifacts.

## Do Not

- Do not select a final production PBKDF2 parameter policy, create a first
  Coordinator account, implement a credential-delivery channel, add a CLI, use
  a deployment secret, or access a real account, Sheet, Drive, D1 database, or
  external service.
- Do not modify published migrations, introduce raw SHA-256, add a dependency,
  store a plaintext password/temporary credential, or return salt/verifier/
  plaintext fields through a DTO.
- Do not implement T009 or later work: sessions, cookies, CSRF, login counters,
  lockout, reset routes, account administration, authorization, or UI.

## Expected Output After Owner Decision

- `src/auth/password.ts` and `src/auth/credentials.ts` (and only a narrowly
  needed redaction helper) with versioned PBKDF2 creation/verification,
  constant-shape missing-account verification, valid-login upgrade signaling,
  and one-time credential generation/forced-replacement primitives.
- Focused Worker-runtime tests for valid, invalid, nonexistent-user, malformed
  metadata, upgrade-required, temporary credential, and redaction behavior.
- No plaintext, salt, verifier, or temporary credential in DTO/snapshot/log
  surfaces.

## Verification After Owner Decision

Run focused Worker-runtime auth tests, then `npm ci`, `npm run check`,
`npm test`, `npm run build`, `npm audit --audit-level=high`,
`npm run scan:sensitive`, and `git diff --check`. Search changed source,
fixtures, test output, and snapshots for plaintext canaries and verifier/salt
leaks. Review the complete diff against T008 only.

## Loop Handoff

After the owner decides the bootstrap, delivery, and provisional-versus-final
parameter boundary, use `run-the-loop` with the changed files, review findings,
and test evidence. Keep the T012 deployed-CPU gate explicit.

## Before You Finish

- Summarize changed files and why PBKDF2 work is Worker-native.
- Explain the verifier version/upgrade and constant-shape paths without
  revealing test credentials.
- Report verification, redaction inspection, remaining T012 evidence, and any
  assumptions without presenting them as owner decisions.
