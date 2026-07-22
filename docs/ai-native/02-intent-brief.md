# Intent Brief

## Status

Approved by the project owner on 2026-07-21. All Intent Brief decisions are
resolved, with non-blocking downstream validations recorded for the PRD and
architecture stages.

## Project Name

CariDana.FILKOM

## One-Sentence Intent

Create a trustworthy, mobile-first internal web application that helps the
FILKOM Day fund-raising team manage each one-product activity from order intake
through fulfillment, payment, reconciliation, closure, and reporting without
the duplicate and hard-to-trace records found in the current spreadsheet flow.

## Primary Users

- The fund-raising coordinator and deputy are the primary accountable users.
  They configure activities, oversee all orders, reconcile money, perform final
  corrections, close activities, and prepare reports.
- Each fund-raising division member has an individual account for operational
  work on assigned sales, payments, fulfillment, and PIC responsibilities.
- Officers are report consumers with view-only access and no access to buyer
  contacts, addresses, or raw operational payment proof. Closed reports may
  include approved evidence links required for validation.
- Treasurers have report-only local accounts and may download closed reports
  without access to operational buyer data.
- Other committee members do not need application accounts. Their sales
  relationships are attributed through the committee master list.

MVP users authenticate with individual local credentials created and managed by
an administrator. Google Sign-In is deferred to a later version.

## User Problem

The current process moves buyer responses manually from Google Forms and Sheets
into operational spreadsheets. This has already caused duplicate records,
incorrect formulas, unclear completion status, and difficult audits. The table
workflow is also impractical on mobile, forcing the small coordinating team to
use laptops during time-sensitive sales and distribution work.

The users need one controlled operational record that distinguishes order,
payment, fulfillment, and PIC remittance status while preserving individual
accountability for changes.

## Goals

- Make one application the operational source of truth for new fund-raising
  activities.
- Support one product and one operating mode per activity: campus sale or
  regional distribution.
- Import new Google Forms responses from the linked Sheet without creating
  duplicate orders when synchronization is repeated.
- Assign every order an immutable internal ID and retain a stable external
  source identity for imported orders.
- Let authorized users trace every order through confirmation, payment,
  fulfillment, PIC remittance, audit, and activity closure.
- Separate recognized sales revenue, collected money, outstanding money, and
  remitted money so financial status is not hidden inside one total.
- Record which authenticated user performed operational and financial changes.
- Make core activity and sales workflows practical from a mobile phone.
- Restrict sensitive buyer and payment data according to role and assignment.
- Produce a closed-activity Excel (`.xlsx`) export while leaving its official
  column structure adaptable to future treasurer guidance.

## Non-Goals

- Replacing Google Forms with a buyer-facing form in the application.
- Push-based or fully realtime Google Forms synchronization.
- Treating the existing Nasi Jaha spreadsheet as clean production history.
- Full offline browsing or offline editing of existing financial records.
- Automatic bank or e-wallet verification.
- Full accounting, procurement, advanced inventory, or route optimization.
- Supporting multiple organizations, campuses, or tenants.
- Supporting multiple products inside one fund-raising activity.
- Implementing unvalidated individual-member sales quotas in the MVP.
- Building elaborate analytics before transaction and audit totals are trusted.
- Google Sign-In or another third-party authentication provider in the MVP.
- Storing payment-proof binary files in the application database.

## Constraints

- The product must be a mobile-first web application, while remaining usable on
  desktop for audits and reports.
- The system is online-first. On a weak connection, a new manual entry may be
  kept as an explicit local draft and retried; it must not affect trusted totals
  before server confirmation.
- Buyer intake remains in Google Forms, with responses stored in Google Sheets.
- MVP synchronization is manually initiated and incremental. Reprocessing the
  same source response must be idempotent.
- The Google Forms response Sheet receives an `Order ID` column. During the
  first manual synchronization of a row, the application writes an immutable ID
  into an empty ID cell and uses it as the source identity on later imports.
- Existing sales and committee spreadsheets are read-only references unless a
  separate migration is explicitly approved.
- Nasi Jaha test data must be sanitized before use; buyer names, phone numbers,
  addresses, map links, and payment proof must not leak into fixtures or demos.
- Regional mode requires area, buyer contact/address, and assigned PIC. Campus
  mode requires a pickup point and PIC without forcing regional delivery data.
- Coordinator and deputy have full access; members have individual operational
  access; officers and treasurers have view-only report access.
- Local accounts are provisioned and revoked by an administrator. Credentials
  must never be stored as plain text. Google authentication is deferred.
- After three consecutive failed logins, the server returns a generic warning
  and applies a short delay. After five, the account is locked server-side for
  15 minutes or until an administrator unlocks it. A successful login resets
  the failure count; restarting the browser never bypasses the lock.
- An administrator resets a forgotten password to a random one-time temporary
  password. The user must replace it immediately after the next login; a common
  reusable default password is prohibited.
- Members/PICs may update operational states and issue notes. Only the
  coordinator or deputy may approve cancellations, refunds, financial
  corrections, final audit, or activity closure.
- Payment-proof files are uploaded to a designated private Google Drive folder
  outside the application, and users manually enter the link. The application
  stores only the Drive file ID/link and supporting metadata. Proof links must
  not be public.
- Payment proofs are retained long-term until an administrator intentionally
  removes them; there is no automatic expiry in the MVP.
- The preferred deployment is one full-stack Cloudflare Worker serving static
  assets and API routes, backed by Cloudflare D1. The architecture must verify
  compatibility and free-tier limits before implementation.
- Excel reports use separate tables in this order: Product & Price Details plus
  Target; All Revenue; Issue/Loss Report; and Final Decision.
- Main report transaction rows include Payment Method/Issue, QTY, Amount (Rp),
  and Notes. Evidence is linked from Google Drive in Notes.
- Excel output uses dark table headers, rupiah currency formatting, and formulas
  for automatic totals. Optional approval rows for the committee chair and
  treasurer appear at the bottom.
- Duplicate records, repeated screenshots, invalid payment proof, buyer-data
  typos, and other human errors must be corrected with traceability. Confirmed
  financial records are voided or corrected with an audit event rather than
  silently hard-deleted; disposable drafts may be deleted.
- There is no fixed release date, but scope should stay small enough to validate
  one complete activity before expanding.

## Tradeoffs

- Manual incremental Sheet synchronization is chosen over push integration to
  reduce infrastructure, failure modes, and maintenance while still removing
  repeated data entry.
- One product per activity is chosen over a flexible catalog so planning,
  totals, and closure remain easy to understand.
- Separate campus and regional modes add conditional fields but avoid forcing
  irrelevant delivery data into every sale.
- Individual member accounts add account management but provide accountability
  that a shared operational account cannot.
- Local admin-managed credentials are simpler for the MVP than Google Sign-In,
  at the cost of password reset and account lifecycle responsibility.
- Server-side temporary lockout is chosen over browser-restart blocking because
  client-side blocking is easily bypassed. Automatic expiry limits accidental
  denial of access, while admin unlock covers urgent operational use.
- Online-first operation with local drafts covers weak connections without the
  conflict resolution required by full offline editing.
- Sanitized Nasi Jaha fixtures provide realistic validation without trusting or
  exposing flawed historical data.
- Reliable operational totals and auditability take priority over sophisticated
  dashboards and visual effects.
- Google Drive is chosen for long-lived payment-proof files to avoid consuming
  application database storage, at the cost of managing private Drive access
  separately from application authorization.
- Cloudflare free-tier compatibility is prioritized over provider-independent
  infrastructure.
- One full-stack Worker deployment is preferred over separate Pages and Worker
  projects to reduce deployment and routing complexity.

## Success Criteria

- Importing the same Google Forms response set more than once creates zero
  duplicate orders.
- Every application order has one immutable and unique internal order ID.
- A source row with an existing Order ID is never imported as a second order.
- Every non-cancelled order exposes its current order, payment, fulfillment, and
  PIC remittance state, with the responsible authenticated user recorded for
  changes.
- Coordinator, deputy, and member users can complete their core workflows on a
  representative mobile viewport without requiring a desktop table workflow.
- Members can access only assigned buyer details; officers and treasurers cannot
  access buyer contact, address, or raw operational payment-proof data. Approved
  evidence links may appear in a closed Excel report.
- Recognized revenue is based on goods received by buyers, while collected and
  outstanding money are calculated and displayed separately.
- At activity closure, recorded collected money and audited remittance agree, or
  every discrepancy remains explicitly listed and blocks silent closure.
- Unsynced local drafts never appear in shared dashboards, reports, or audited
  totals until the server confirms them.
- A completed activity can be closed and exported as a valid Excel (`.xlsx`)
  workbook.
- Operational users cannot approve cancellation, refund, financial correction,
  final audit, or closure actions; officers and treasurers cannot perform any
  mutation.
- Payment-proof content is absent from the application database, and stored
  Drive references are inaccessible through public sharing.
- Login failure counters and locks persist on the server across browser restarts;
  locked accounts automatically recover after 15 minutes or an admin unlock.
- Password reset issues a one-time temporary password and forces replacement on
  the next successful login.
- The Excel export contains all four required table groups, required transaction
  columns, rupiah formatting, automatic total formulas, evidence links, and
  optional signature rows.
- Corrections to confirmed financial records preserve the previous value, actor,
  time, and reason in the audit history.

## Open Questions

No Intent Brief decision remains blocking. Downstream validation must still:

- verify that the actual Google Forms response Sheet can safely receive and
  preserve the application-managed `Order ID` column;
- confirm private Google Drive folder permissions and the manual proof-link
  workflow with representative users;
- obtain treasurer approval for the generated Excel layout before production
  reporting;
- validate full-stack Workers and D1 against the selected framework, expected
  usage, and current free-tier limits; and
- define the exact interface for reviewing, voiding, correcting, and restoring
  human-error records without erasing audit history.

## Sources Read

- `docs/ai-native/01-grill-my-idea.md` - approved Idea Grill Report, including
  user answers, observed workflows, accepted MVP boundary, risks, and decision
  gate.
- Cloudflare D1 pricing and Pages Functions documentation - checked on
  2026-07-21 to validate free-tier relational storage and compare Cloudflare
  deployment options.
- Cloudflare Workers Static Assets, full-stack application, Workers pricing,
  and D1 documentation - checked on 2026-07-21 to select a single-deployment,
  free-tier-first platform direction.
