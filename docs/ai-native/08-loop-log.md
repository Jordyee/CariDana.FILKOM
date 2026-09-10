# Loop Plan for Issue #6 / T001

## Sources Read

- `AGENTS.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/07-issue-prompt.md`

## Source of Truth

**Issue:** GitHub Issue #6 / T001 — Turn the accepted spike into a safe product
foundation.

**Goal:** Turn the accepted synthetic compatibility spike into the smallest safe
production-shaped CariDana.FILKOM foundation, retaining the accepted pinned
stack while making spike-only routes and the isolated D1 identity impossible to
expose through product configuration.

**Acceptance Criteria:**

- [ ] Package metadata, commands, and entry points identify CariDana.FILKOM,
  rather than a deployable spike.
- [ ] Hono, Wrangler, TypeScript, the Worker test pool, and
  `write-excel-file@4.1.1` remain at their accepted pinned versions.
- [ ] A pinned Vite static client is built without SSR or another application
  server and is served by the same Worker.
- [ ] Synthetic probe routes and the isolated spike D1 identity cannot be
  exposed by a production configuration.
- [ ] CI covers clean lockfile install, type/binding checking, Worker-runtime
  tests, dry-run build, and dependency audit without secrets.
- [ ] Environment bindings are typed and no production resource ID, credential,
  session secret, or buyer data is committed.

**Constraints:**

- One fresh `codex/t001-safe-product-foundation` branch from current approved
  `main`; check upstream, working tree, and configured Git identity first.
- Keep the approved stack and exact accepted dependency/compatibility versions.
- Use one Worker with Vite static assets; Web-standard Worker code only.
- Preserve unrelated work and append redacted WITA evidence to the action log.
- Use synthetic data only. Do not deploy, run remote D1 commands, access the
  spike D1 database, write Sheets, use Drive, or use credentials.

**Do Not Change:**

- T002 or later scope, including privacy fixtures, auth, product schema, orders,
  Sheet/Drive integration, report lifecycle, or weak-network drafts.
- The stack, dependency pins, compatibility date, security/privacy boundary, or
  product architecture without an owner-reviewed amendment.
- Existing action-log history, shared Git history, real external systems, or
  production resources.

## Loop Setup

**Prompt to use:** `docs/ai-native/07-issue-prompt.md`.

**Initial files to inspect:**

- `package.json`, `package-lock.json`, `wrangler.jsonc`, `tsconfig.json`,
  `vitest.config.ts`, and `worker-configuration.d.ts`
- `src/index.ts`, `src/auth.ts`, `src/workbook.ts`, `public/index.html`,
  `test/worker.spec.ts`, and `migrations/0001_spike_probe.sql`
- `docs/ai-native/16-stack-compatibility-spike.md`, existing CI configuration,
  and `docs/ai-native/17-agent-action-log.md`

**Verification commands/manual checks:**

- `npm ci`
- `npm run check`
- `npm test`
- `npm run build` (dry run only)
- `npm audit --audit-level=high`
- generated-binding and dry-run-bundle inspection
- redacted source/configuration/bundle scans for spike and secret-shaped values
- `git diff --check`, full diff review, CI workflow review, and PR head/base
  review

**Loop limit:** Three build/review cycles under this learning loop. The binding
AGENTS.md four-attempt policy still governs distinct verification remediations;
after its fourth failed attempt, stop and report rather than make a fifth.

## Cycle Log

### Cycle 1

**Build Attempt:**

- Prompt used: `docs/ai-native/07-issue-prompt.md`
- Files changed: Product package/build scripts and lockfile; Worker/assets and
  generated binding types; Vite client and browser typecheck; Worker tests; CI;
  ignore rules; prompt/loop/action-log artifacts. Retired spike-only source,
  static asset, and migration files were removed from the product path.
- AI assumptions: The current merged `main` was the approved baseline after an
  upstream refresh. The owner approved `vite@8.3.0` before it was added. The
  existing compatibility-evidence document and Git history preserve the
  historical spike evidence without retaining it in product configuration.

**Review Result:**

- Status: Pass, pending the final GitHub PR head/base review.
- Findings: The initial browser/client typecheck lacked DOM libraries and the
  replaced Worker test retained two obsolete closing lines. A dedicated client
  TypeScript configuration and focused test cleanup fixed both. The inherited
  client exclusion then caused one no-input check failure; overriding that
  exclusion resolved it. Audit initially had five high findings through pinned
  Worker tooling; exact transitive `sharp` and `undici` overrides removed all
  high findings without changing the accepted direct pins.

**Test Result:**

- Commands/checks run: `npm ci`, `npm run check`, `npm test`, `npm run build`,
  `npm audit --audit-level=high`, generated-binding inspection, dry-run bundle
  inspection, configuration/bundle scans, `git diff --check`, and complete
  local diff review.
- Evidence: clean install passed; type/binding checks passed; five Worker
  runtime tests passed; Vite built three static assets; Worker dry-run exposed
  only the `ASSETS` binding; high-severity audit passed with four moderate
  findings remaining in accepted direct dependencies; all redacted runtime,
  bundle, and secret-shaped scans passed.
- Failures: Attempt 1 found missing browser DOM types and stale test syntax.
  Attempt 2 corrected the inherited client exclusion; all targeted checks then
  passed. The high-severity dependency finding was remediated with scoped
  transitive overrides and rechecked successfully.

**Decision:**

- [x] Accept for PR review
- [ ] Continue with fix prompt
- [ ] Rollback
- [ ] Split issue
- [ ] Ask for help

### Cycle 2

Reserved only if Cycle 1 has a scoped review or verification finding.

### Cycle 3

Reserved only if Cycle 2 has a scoped review or verification finding.

## Stop Conditions

The loop can stop only when:

- [x] Every T001 acceptance criterion maps to passing automated or inspection
  evidence.
- [x] All required commands have passed; failed baseline issues are either
  safely resolved in T001 or cause the required hard stop.
- [x] Review finds no scope, security, privacy, migration, dependency, secret,
  or unrelated-change concern.
- [x] Product configuration cannot expose the spike behavior or isolated D1
  identity, and scans report results without echoing sensitive matches.
- [ ] The complete PR gate in `AGENTS.md` passes, including clean head/base,
  checks, diff, and action-log evidence.
- [ ] The final handoff explains the change, evidence, residual risk, and that
  T002 has not begun.

## Final Student Explanation

I will accept the change only when the production-shaped foundation is
demonstrably separate from the throwaway spike, all required T001 gates pass,
and the reviewed PR contains no sensitive or out-of-scope work.

The most important expected change is the safe Worker/Vite/configuration
boundary that preserves accepted pins while preventing spike deployment.

The verification evidence will be the complete clean-install/check/test/build/
audit suite plus binding, bundle, configuration, CI, and full-diff reviews.

One thing still requiring evidence is whether the existing stale generated
bindings and dependency-audit findings can be resolved within the accepted
versions; neither can be called passing in advance.
