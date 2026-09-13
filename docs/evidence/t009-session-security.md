# T009 session-security evidence

## Scope and accepted policy

Issue #14, based on T008 merged commit `8eb9d47`. The owner approved an 8-hour
absolute / 15-minute idle normal session and a 10-minute restricted session.
This change implements only session primitives, middleware, CSRF acquisition,
logout, and revocation persistence. Login, recovery/account routes, role policy,
bootstrap, credential delivery and UI remain later tasks.

## Security construction

- A new session receives 32 CSPRNG bytes encoded as an opaque cookie token.
  Only its SHA-256 digest is stored. Cookies use a `__Host-` name, Secure,
  HttpOnly, SameSite=Lax, Path=/, no Domain and bounded Max-Age/Expires.
- The server derives CSRF material with HMAC-SHA-256, using the random session
  token as key and a fixed, domain-separated CSRF message. The value is unique
  per session, not computable from the database digest, and never equals the
  authentication token. Web Crypto verifies the submitted MAC; there is no
  application string comparison of secrets. Exact Origin plus Fetch Metadata
  validation supplements the required token for every unsafe method.
- D1 account generations bind issuance to the verified credential snapshot.
  Credential/active/reset-flag changes revoke all sessions transactionally;
  current account state is joined on every protected request. Issuance and its
  security metadata are one batch. A stale verification cannot issue a session
  after reset/deactivation, even after reactivation.
- Only CSRF acquisition and logout admit restricted sessions. All later API
  handlers inherit normal-session enforcement. Missing/invalid/revoked/expired
  sessions get a generic denial, and raw exceptions are not logged or returned.
- Missing cookies do not cause a clearing Set-Cookie response. This matters
  because SameSite=Lax omits cookies from a foreign-origin form POST: clearing
  that absent cookie would otherwise create a logout-CSRF vulnerability.

The construction follows the server-side expiry, opaque session and per-session
CSRF principles in [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
and [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
D1 batches provide transaction rollback as documented in the
[D1 Database API](https://developers.cloudflare.com/d1/worker-api/d1-database/).

## Reproducible local evidence

- `test/auth/session.integration.spec.ts`: real Hono/Worker requests and local
  D1, exact idle/absolute boundaries, all five account roles, restricted access,
  missing/duplicate/malformed/forged tokens, session fixation/replay, CSRF denial,
  logout, reset/deactivation/invalidation, stale issuance, concurrent touch and
  revocation, generic errors, no-store responses, and production router wiring.
- `test/db/session-security-migration.spec.ts`: fresh/upgrade/no-op/failed-DDL
  rollback, metadata/lifecycle constraints, index usage, legacy preservation,
  generation changes and failed-account-transaction rollback.
- `scripts/verify-session-browser.mjs`: optional real Chromium test with
  external Playwright, ephemeral browser contexts and loopback HTTPS Miniflare.
  The fixture issuer is bundled only in memory and never into the product.
  It checks browser cookie flags, JavaScript HttpOnly exclusion, CSRF/logout,
  cross-session token denial, foreign-origin form resistance and deactivation
  at 360x800 and 390x844. No screenshot, cookie or token is retained.

For the browser script, set `SESSION_TEST_PLAYWRIGHT` to the absolute path of an
installed Playwright module, then run `node scripts/verify-session-browser.mjs`.
It defaults to the installed Edge Chromium channel; another installed channel
can be selected with `SESSION_TEST_BROWSER_CHANNEL`. No project dependency is
added. The self-signed-certificate exception is confined to disposable loopback
contexts. Workerd may print certificate-unknown handshake diagnostics while the
browser retries; the script's final pass/fail and browser assertions determine
the result. These diagnostics contain no session or account material.

## Verification results and remaining boundary

Local browser assertions passed after fixing the missing-cookie logout-CSRF
case. The final full command results are recorded in the action log and review.
No test endpoint is registered in production; no real DB binding, account,
credential, external integration or deployment was created.

**Owner gate amendment — 2026-09-14 WITA:** The owner explicitly moved deployed
same-origin cookie/CSRF judgment to the mandatory T012 gate and approved T009
acceptance/merge on the reviewed local evidence. Loopback HTTPS remains local
evidence; the deployed proof is not waived or claimed. T012 now retains both
CPU and deployed same-origin cookie/CSRF review before protected feature work.
This grants no deployment or real-data authority. T010 is not started here.

## Compact handoff

- Task/issue: T009 / #14; branch `codex/t009-session-security`.
- Implementation commit: `a9a3480`; [PR #55](https://github.com/Jordyee/CariDana.FILKOM/pull/55)
  against approved main `8eb9d47`. The PR timeline identifies the final audit head.
- Changes: session auth/repository/middleware/routes, sequential migration 0006,
  schema/redaction support, API and migration regressions, local browser harness,
  approved policy and prompt/loop/review/action evidence.
- Verification: 197 Worker + four Node tests; type/bindings, dry-run build,
  high-severity audit, privacy scan, complete diff review and local Chromium pass.
- Dependencies: T003/T008 merged. T010 is next after the T009 reviewed merge;
  no next issue is started or created from this task.
- Pending later gate: T012 deployed same-origin cookie/CSRF judgment and CPU
  proof. The owner-approved reassignment is recorded in 15-clarification-log.md
  and in T009/T012 of 05-issues.md. PR merge and post-merge evidence are recorded
  in the GitHub timeline and final audit comment.
