# Code Review Report — T009 / Issue #14

## Sources Read

AGENTS.md; relevant PRD US-001/FR-001/FR-002/NFR-001–004; architecture session
flow/security; T009 and T010–T013 boundaries; approved clarification; prompt and
loop log; complete changed source, migration, test and browser-harness files;
existing identity/schema and privacy tests; configured CI.

## Verdict

**Pass for T009 acceptance and the final PR merge gate.** On 2026-09-14 WITA,
the owner explicitly moved deployed same-origin cookie/CSRF judgment to T012.
Reviewed local evidence satisfies T009 under that amendment; deployed proof is
still mandatory at T012 and is not claimed here. Lifetime and bootstrap/delivery
decisions are already approved. T010 is not started in this task.

## Acceptance Mapping

| Requirement / criterion | Evidence and result |
| --- | --- |
| FR-001, NFR-002: random bounded cookie | 32 CSPRNG bytes, hash-only D1, host-only Secure/HttpOnly/Lax/Path and bounded expiry; Worker and real local Chromium tests pass |
| NFR-002: expiry/revocation | Exact absolute/idle/restricted boundaries; logout, credential changes, reset flag, deactivation, explicit invalidation, stale issuance and concurrent touch; pass |
| FR-002, NFR-001: server enforcement | Shared API middleware, normal/restricted separation, current account join, unregistered/production routing and all five account roles; pass within T009 authentication scope |
| CSRF acceptance | Per-session domain-separated HMAC verified through Web Crypto, exact Origin and Fetch Metadata checks; missing/invalid/cross-session/cross-origin denials pass |
| NFR-003/004: privacy and generic errors | No-store generic responses, no raw exception logging, credential/token/cookie/header redaction, no raw token persistence; scanner passes |
| Migration safety | 0006 only; fresh/upgrade/no-op/failed-DDL rollback, transaction rollback, strict metadata, indexes, one-way revocation; six focused tests pass |
| Deployed same-origin judgment | Mandatory at T012 by owner amendment; not a remaining T009 acceptance gate. Loopback Chromium remains local evidence |

## Findings and Resolutions

- Browser review found logout CSRF: a foreign-origin POST omits the Lax cookie,
  but a clearing response could still remove the browser session. Missing-token
  denial now omits Set-Cookie; direct and browser regressions pass.
- Previous migration counts/column lists and retired-route 404 expectations were
  updated to the exact approved 0006 and API-authentication behavior. No assertion
  was removed or loosened to hide a defect. The rollback assertion additionally
  accepts the new one-way revocation constraint while still proving rollback.
- Secured session metadata and lifetime are immutable; account generations
  prevent issuance using pre-reset verification. An authorized future T010
  caller must retain the generation associated with the verified credential.
- Middleware is not a database lock. Future business actions must enforce their
  own authorization/session predicates atomically with effects; those actions
  are not implemented here.

No outstanding must-fix code finding. No unrelated feature, dependency change,
published migration rewrite, real identifier, skipped test, secret/PII leakage,
debug production endpoint or product permission grant was found.

## Verification

- npm ci: pass, locked dependencies unchanged.
- Focused T009: 26 auth and six migration cases in the final full suite.
- npm run verify: pass, including type/binding checks, 197 Worker tests and four
  Node privacy tests.
- npm run build: pass with process-local WRANGLER_SEND_METRICS=false; the initial
  invocation generated the dry-run artifact but was interrupted while remaining
  alive after its completion message. The successful rerun exited zero. Only
  ASSETS is configured; this was not deployment.
- npm audit --audit-level=high: pass, four pre-existing moderate/no-high findings.
- Local Chromium harness: pass at 360x800 and 390x844, including HttpOnly,
  browser cookies, cross-session/foreign-form CSRF, logout/replay and deactivation.
- Sensitive scan: 77 files / zero findings before final review-document updates;
  rerun before staging. Whitespace check passes.
- Product bundle inspection: no synthetic fixture issuer, protected test handler
  or TEST_DB. Playwright and the local issuer stay outside the production build.

## Residual Risks and Missing Evidence

T009 has no configured deployed DB, login route, account administration UI or
deployed browser proof. T010/T011/T012 own login/recovery, complete authorization
and deployed CPU respectively. This PR does not satisfy those later issues.
The owner assigned deployed same-origin judgment to T012. That gate still needs
an explicitly authorized isolated synthetic environment and owner review; this
amendment authorizes no deployment or real-data access.

## Explanation and Loop Decision

The browser holds an unpredictable bearer cookie; D1 knows only its digest.
CSRF material cannot authenticate and cannot be reused in another session.
The database generation changes on account security transitions and revokes
existing sessions atomically. Idle use may advance last-seen time, never the
absolute deadline or revocation state. A restricted session cannot gain normal
access by having an account flag cleared.

Accept T009 under the approved gate amendment. Recheck the amended PR head,
base, complete diff, CI and unresolved comments before marking ready/merging.
The amendment changes documentation and gate ownership only; no runtime,
dependency, schema or test changes follow the passing implementation evidence.
