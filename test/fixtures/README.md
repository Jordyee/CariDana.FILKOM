# Synthetic fixture catalog

All records were invented for T002. No buyer row, source price, proof, contact,
or credential was used. Names say `Pembeli Sintetis`; phones are non-dialable
`SYNTHETIC-PHONE-` sentinels; addresses are `ALAMAT-SINTETIS-` sentinels. PICs,
areas, committee attribution, IDs and dates are synthetic. URLs end in `.invalid`
and must never be requested over the network. These are test records, not D1
schema or production phone/proof validators.

## Scenarios and hand arithmetic

`catalog.ts` contains two separate one-product, one-mode activities and five
additional state-shape orders. Unit sale/purchase values and costs are invented
small integer rupiah values, deliberately unrelated to source pricing.

| Finance scenario | Recognized | Collected | Outstanding | Remitted | Planned capital | Approved loss |
| --- | --- | --- | --- | --- | --- | --- |
| Campus active: c1, c2, c3 | (2 + 1 + 1) × 1700 = 6800 | 3400 + 600 + 1700 = 5700 | 6800 − 5700 = 1100 | 3400 + 0 + 0 = 3400 | 5 × 700 + 300 = 3800 | 0 |
| Regional closed: r1, r2 | (2 + 1) × 1700 = 5100 | 3400 + 1700 = 5100 | 5100 − 5100 = 0 | 3400 + 1700 = 5100 | 4 × 700 + 200 = 3000 | 200, separately approved packaging loss |

`expected-finance.ts` declares these six totals as literals, without importing
production logic or fixture calculations. Test-only arithmetic cross-checks the
inputs. The campus sample has received-but-partial payment and paid-but-unremitted
money, an open issue, and closure blockers. Regional has two areas/PICs, a synthetic
Form source/proof, a resolved issue, approved loss and audited closed snapshot.
Campus has both known and pickup-assigned attribution. Manual sources have
idempotency keys and no Sheet identity. Corrections preserve before/after,
reason, actor/time and cancellation approval.

The extra state examples cover pending, cancelled, not processed, carried,
problematic, unpaid and remitted states. Together with finance examples they
cover every PRD enumeration on all four axes. They are not added to either
finance activity or assigned aggregate totals. Finance samples contain only
confirmed received orders: T002 does not decide debt-before-delivery, refunds,
overpayment or cancellation finance semantics still pending in H1. Future
finance issues must resolve those decisions before extending their oracles.

## Running the privacy boundary

- `npm test`: Worker fixture/network tests and Node temporary artifact canaries.
- `npm run build`: produces client and dry-run Worker output in `dist/`.
- `npm run scan:sensitive`: scans active tracked/untracked files including ignored
  evidence directories, logs, exports and `dist/`. Explicit paths can follow `--`.
- CI runs the scanner after build. Never upload failure artifacts automatically.

Diagnostics contain only a file ordinal and rule code, never values or filenames.
Rules cover service-resource links, maps, Indonesian phone/street forms, emails,
common personal/credential fields, tokens, private keys and opaque source IDs.
Known-bad canaries are assembled from synthetic strings only in temporary files.
The scanner is a guard against known patterns, not proof that arbitrary prose
or arbitrary financial values cannot contain PII. Strict fixture fields and
documented invented finance values provide complementary evidence.

Text artifacts (including SVG/CSV/XML) are scanned. Raster screenshots, XLSX/ZIP,
PDF, malformed UTF-8, symlinks, and oversized/unreadable files fail closed; no OCR
or archive decoding is claimed. Such evidence cannot pass this gate until a
later scoped change provides inspected decoding and canary coverage. There is no
blanket binary allowlist. Repository-root Git history, installed third-party
dependencies, and local Wrangler cache/state are excluded; nested evidence
directories with these names remain scanned. Dry-run bundles are explicitly placed
in scanned `dist/worker`. History privacy remains T038 under owner decision.

Native Worker fetch is blocked at the Miniflare outbound service (constant 599,
redacted body). Use `syntheticFetch` for registered in-memory `.invalid` responses;
it never delegates or follows redirects. Tests use only synthetic paths with
public service hostnames to verify denial. This is not authorization for an
external integration or any real resource/credential.
