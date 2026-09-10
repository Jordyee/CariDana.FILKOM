# AI Coding Prompt

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- GitHub Issue #6, `T001: Turn the accepted spike into a safe product foundation`

You are working on GitHub Issue #6 / Task ID **T001**: **Turn the accepted spike
into a safe product foundation**. This is the only implementation issue in
scope. Do not begin T002 or any later task.

## Goal

Replace the accepted, synthetic compatibility-spike scaffold with the smallest
safe production-shaped foundation for CariDana.FILKOM. Retain the owner-approved
pinned stack—TypeScript, Hono, one Cloudflare Worker, D1, a Vite-built static
client, and `write-excel-file@4.1.1`—while ensuring throwaway probe behavior and
the isolated spike D1 identity cannot be exposed by a product configuration.

## Relevant Context

- NFR-023 requires one full-stack Cloudflare Worker with static assets and API
  routes, backed by D1. NFR-025 requires business code to remain independently
  testable from UI rendering. NFR-026 requires reproducible versioned SQL
  migrations.
- The client must be a pinned Vite static build served by the same Worker; SSR,
  a second application server, microservices, an ORM, and another storage
  service are outside the approved architecture.
- The spike was accepted only as a sanitized compatibility proof. Its synthetic
  probe routes, schema, and isolated D1 configuration are not product runtime
  behavior. Preserve historical evidence only where it cannot be deployed or
  imported into a product configuration.
- No production database identity, Google credential, session secret, buyer
  data, proof reference, real spreadsheet identity, or sensitive financial data
  may enter source, tests, logs, generated bundles, commits, PR text, or the
  action log. Use only clearly synthetic data.
- Do not add product features, migrations beyond what is strictly needed for
  safe scaffold isolation, auth behavior, order behavior, Sheet integration,
  Drive access, report lifecycle, or T002 privacy fixtures. Those belong to
  later tasks.

## Files to Inspect First

- `package.json` and `package-lock.json`
- `wrangler.jsonc`, `worker-configuration.d.ts`, `tsconfig.json`, and
  `vitest.config.ts`
- `src/index.ts`, `src/auth.ts`, `src/workbook.ts`, `public/index.html`,
  `test/worker.spec.ts`, and `migrations/0001_spike_probe.sql`
- `docs/ai-native/16-stack-compatibility-spike.md` and
  `docs/ai-native/17-agent-action-log.md`
- Any generated Vite/Worker binding output and any CI workflow location before
  modifying it

## Constraints

- Work from a fresh `codex/t001-safe-product-foundation` branch based on the
  latest approved `main`, after first checking branch, upstream divergence,
  working-tree changes, and configured Git identity without exposing the email.
- Keep the accepted versions of Hono, Wrangler, TypeScript, the Cloudflare
  Worker Vitest pool, and `write-excel-file@4.1.1` exactly pinned. A dependency
  or compatibility-date change requires an owner-reviewed spike amendment; do
  not make one.
- Use one Worker to serve both `/api/*` and Vite static assets. Keep Worker code
  Web-standard and route policy/business modules testable without rendering.
- Treat the current isolated spike database identity as historical sensitive
  evidence: remove it from any deployable product configuration, do not repeat
  it in replacement files, test output, action-log rows, commits, or PR text,
  and do not access it remotely.
- Keep the implementation narrowly T001-scoped. Preserve unrelated user work
  and prior action-log rows. Add only append-only action-log entries with WITA
  timestamps and redacted evidence.
- Required checks are `npm ci`, `npm run check`, `npm test`, `npm run build`,
  and `npm audit --audit-level=high`. Inspect the dry-run bundle and generated
  binding types, and scan product configuration/bundles for spike identifiers
  and secret-shaped values without echoing matches.
- Treat any failed gate through the four-attempt policy. Do not weaken tests,
  suppress audits, claim a failed command passed, deploy, run remote D1
  commands, write a Sheet, or use real external systems.

## Do Not

- Do not implement T002, authentication, schema/model work, manual orders,
  Sheets, Drive, reports, or a new feature merely because a directory exists.
- Do not publish a release, deploy, run a remote migration, access the isolated
  spike D1 database, create a Cloudflare resource, or use a real credential.
- Do not introduce unpinned dependencies, SSR, Node-only Worker assumptions,
  another backend, another database, or an ORM.
- Do not leave a deployable probe endpoint, a product-configured spike D1
  identifier, a placeholder secret, or a real-looking external ID in the
  product path.

## Expected Output

- Product-named package metadata, commands, entry points, Worker/static-client
  composition, typed bindings, and CI workflow that make the approved
  foundation explicit.
- A pinned Vite static-client build whose generated output is served by the
  same Worker, with focused Worker/runtime tests.
- Isolated or removed throwaway probes and spike-only D1 configuration so they
  cannot be selected by a production configuration.
- A clean separation between bootstrap/runtime code and any retained historical
  compatibility evidence, with no sensitive identifier copied into product
  artifacts.
- Append-only action-log evidence, one reviewable T001 commit, a PR against
  `main` that includes `Closes #6`, and an audit-ready acceptance mapping.

## Acceptance Mapping

| Acceptance criterion | Required evidence |
| --- | --- |
| Product metadata, commands, and entry points describe CariDana.FILKOM | Review `package.json`, commands, Worker/client entry points, and focused tests. |
| Accepted stack remains pinned | Compare manifest and lockfile exact versions; explain any proposed change as a hard stop. |
| Pinned Vite static client is served by the same Worker, with no SSR/second server | Inspect Vite config/build output and Worker asset routing; run build and Worker tests. |
| Probe routes and isolated spike D1 identity cannot be exposed in production | Configuration/source/bundle scan with redacted results; direct route/config tests where applicable. |
| CI covers install, type/binding check, Worker tests, dry-run build, and dependency audit without secrets | Inspect/add CI workflow and scripts; verify commands use no credentials. |
| Bindings are typed and no sensitive product data/config is committed | Run binding-type generation/check and redacted scan of tracked product configuration and generated bundle. |

## Verification

1. Run `npm ci` from a clean dependency state.
2. Run `npm run check` and inspect generated Worker binding types.
3. Run `npm test` in the Worker runtime.
4. Run `npm run build` as a dry-run only; inspect the output for static assets,
   expected routes, and absence of probe/sensitive configuration.
5. Run `npm audit --audit-level=high`; any findings remain a failing gate until
   safely resolved within T001 or reported under the four-attempt policy.
6. Run `git diff --check`, review the complete diff, inspect CI configuration,
   and run a redacted configuration/bundle scan for spike identifiers and
   secret-shaped values.
7. Before merge, map every criterion above to passing test, inspection, or an
   explicitly pending external/human item. Review the PR head/base/comments and
   configured checks; merge only when all AGENTS.md gates pass.

## Loop Handoff

After owner acceptance of this prompt, use `run-the-loop` for the bounded T001
build, review, test, fix, PR, and merge cycle. Record every material
state-changing action and verification result in the append-only action log.
Stop after the T001 handoff; T002 requires a fresh task.

## Before You Finish

- Summarize changed files and explain any assumptions.
- Report every verification command with its actual result and concise redacted
  evidence.
- Identify residual risk, including any baseline dependency or binding failure.
- Confirm no T002-or-later implementation was included and no external system
  was touched.
