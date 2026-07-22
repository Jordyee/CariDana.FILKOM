# Idea Grill Report

## Status

Approved by the project owner on 2026-07-21 and amended during Intent Brief
review on the same date. The user, problem, product boundary, roles, workflows,
MVP, non-goals, success criteria, and principal risks are defined.

## Restated Idea

Build a mobile-first web application for the FILKOM Day fund-raising team to
replace fragmented spreadsheet work with one controlled source of truth. The
application should let authorized committee members create a fund-raising
activity, record sales and member contributions, track payment and fulfillment,
monitor current results, close the activity, and prepare its final report.

The application is an internal operational tool, not a public marketplace. Its
main value is reliable coordination and accountability while a fund-raising
activity is running.

## Main Users

Confirmed users and intended account model:

- Fund-raising coordinator, responsible for monitoring and reporting all
  fund-raising activities; one account with full access.
- Deputy fund-raising coordinator; one account with full access.
- Each fund-raising division member; one individual account per member with
  operational access only.
- Event officers; one shared officer account with view-only access.

MVP authentication uses local accounts created and managed by an administrator.
Google Sign-In is deferred to a later version; user accounts are not shared
between the coordinator, deputy, and fund-raising members.

Other committee members contribute buyer relationships but are not currently
expected to sign in. Their contribution is recorded against the committee
master data.

## Problem Being Solved

The current spreadsheet can store data, but the operational process is hard to
control on mobile and across multiple people. The coordinator needs to know:

- what fund-raising activities exist and whether each is planned, active, or
  complete;
- which committee member or division contributed each sale;
- whether an order is confirmed, paid, picked up, or still unresolved;
- whether recorded cash and transfers reconcile with expected revenue; and
- whether the final activity report is complete and defensible.

The core problem is therefore not merely "show spreadsheet data in an app." It
is maintaining a trustworthy shared operational record from planning through
financial closure.

## Evidence And Facts

- A Nasi Jaha sale has already been recorded for Manado, Bitung, Minahasa Utara,
  and Tomohon.
- Existing sales records include division, committee member, quantity, pickup
  status, total, payment method, proof, buyer name, notes, area, address, and
  phone/WhatsApp data.
- The existing plan/report structure includes product pricing, target, revenue,
  capital, profit, payment-source totals, and issue reporting.
- Some spreadsheet formulas currently produce errors, demonstrating a data
  reliability problem.
- A current committee structure with 70 members is available and organized by
  role and division.
- The application is expected to be used predominantly from mobile devices.
- Final export rules have not yet been supplied by the treasurer.
- Duplicate records and broken formulas have already caused incorrect and
  difficult-to-trace results.
- The spreadsheet is sufficiently difficult to operate on a phone that core
  data management usually requires a laptop.
- Pre-orders are currently captured through a form and then manually rewritten
  by the coordinator or deputy into the spreadsheet.
- Two distinct fulfillment workflows are known: regional delivery through area
  PICs and on-campus pickup from one selling point.
- A third contribution model based on a quota for each member is only a future
  possibility; it has not been operationally validated.

## Hard Questions

### Answers Collected

1. The coordinator and deputy have individual accounts with full access. Each
   fund-raising division member has an individual account with operational
   access. Officers use a view-only account.
2. Member access is limited to operational work such as sales, payment, and
   fulfillment updates. Members cannot change activity configuration, perform
   final audit corrections, or close an activity.
3. The main observed failures are duplicate data, incorrect formulas, inability
   to identify which records are complete, and poor mobile usability.
4. Real workflows have been supplied for regional delivery and on-campus
   pickup, as documented below.

5. Member permissions are operational rather than full administrative access.
6. Shared member credentials are rejected; every fund-raising division member
   receives an individual account so changes can be attributed.
7. One fund-raising activity sells exactly one product. It may still use the
   regional or campus operating workflow.
8. Buyers continue submitting through Google Forms, with responses stored in a
   linked Google Sheet. The MVP uses a manual incremental sync action. Scheduled
   synchronization is a later enhancement, and true push synchronization is
   excluded.
9. Separate order, payment, fulfillment, and PIC remittance states are accepted.
10. A sale is financially recognized when goods are received. Money actually
    received is tracked separately, so recognized revenue, collected money, and
    outstanding money cannot be conflated.

11. Every activity must select either campus sale or regional distribution mode.
    Regional mode requires area, address, buyer contact, and assigned PIC;
    campus mode requires a pickup point and PIC without forcing delivery fields.
12. The first release starts with new operational data. Existing Nasi Jaha data
    is used only as a sanitized dummy/test dataset. A real historical migration
    may be considered later after duplicate and formula problems are cleaned.

### Final Validation Decisions

- Buyer personal data is limited by responsibility: members/PICs see only their
  assigned orders, the coordinator and deputy see all operational data, and
  officers see reports without buyer contact, address, or payment proof.
- MVP success means no duplicate imports, every order has traceable states, core
  recording works from a phone, and the audited result matches collected money.
- There is no fixed release deadline. The product is online-first and assumes a
  usable connection.
- Weak-network support is intentionally narrow: a user may preserve a new-entry
  draft locally and retry submission when connected. Full offline browsing and
  offline editing of existing financial records are not MVP requirements.

### Intent Review Clarifications

- The product name is `CariDana.FILKOM`.
- Every application order has an immutable internal ID. An imported order also
  uses an `Order ID` column in the Google Forms response Sheet. On first manual
  synchronization, the application assigns and writes an ID when the source row
  does not have one; repeated synchronization uses that ID to prevent duplicate
  imports.
- Local credentials are created and revoked by an administrator. Google
  authentication is a later-version option.
- After three failed logins, the application warns the user and applies a short
  delay. After five failures, the account is locked server-side for 15 minutes
  or until an administrator unlocks it. Restarting the browser does not bypass
  the lock. Password resets use a one-time temporary password and force a new
  password after login.
- Members/PICs may update operational states and add issue notes. The
  coordinator or deputy approves cancellations, refunds, financial corrections,
  final audit, and activity closure. Officers remain view-only.
- Payment-proof files are retained long-term in a private Google Drive folder.
  Users enter the private Drive link manually; the application database stores
  only a Drive file ID/link and metadata.
- Closed-activity reports are exported as Excel workbooks (`.xlsx`).
- The Excel workbook uses separate Product & Price Detail/Target, All Revenue,
  Issue/Loss Report, and Final Decision tables. Transaction rows include payment
  method or issue, quantity, amount in rupiah, and notes. Dark headers, currency
  formats, automatic totals, Drive evidence links, and optional chair/treasurer
  signature rows are required.
- The preferred deployment is one full-stack Cloudflare Worker serving static
  assets and API routes, with Cloudflare D1 as the relational database. The
  architecture must validate this free-tier-first choice before implementation.
- Duplicate, repeated-proof, invalid-proof, typo, and human-error cases are
  corrected without silently deleting financial history. Confirmed records are
  voided or corrected with an audit event; only disposable drafts may be hard
  deleted.

## Observed Workflows

### Regional Or Distant Delivery

1. Committee members share the fund-raising poster and find buyer relationships.
2. Buyers submit a pre-order form.
3. The coordinator or deputy rewrites the submitted data into the spreadsheet.
4. On fulfillment day, the coordinator collects the order from the vendor.
5. The coordinator distributes goods to PICs responsible for their respective
   areas or teams.
6. PICs deliver the goods and update pickup/delivery and cash/transfer status.
7. The coordinator monitors delivery progress.
8. PICs remit collected cash or transfers into the activity's main account.
9. The coordinator and deputy audit and recap sales.
10. The resulting report is sent to officers.

### On-Campus Sale

1. A selected fund-raising member acts as PIC and distributes the poster.
2. Other committee members find buyer relationships.
3. On fulfillment day, the PIC operates one pickup point.
4. Buyers arrive and are matched to the committee member or division that
   provided the relationship.
5. Buyers without a known relationship are assigned to a division quota.
6. Sales repeat until inventory is exhausted.
7. Cash is remitted into the activity's main account.
8. The coordinator and deputy audit and recap sales.
9. The resulting report is sent to officers.

### Unvalidated Future Model

Sales quotas may later be assigned to individual committee members instead of
divisions. This has not been used and its workflow is unknown, so it is not part
of the candidate MVP unless evidence changes.

## Accepted Transaction States

- Order: pending confirmation, confirmed, or cancelled.
- Payment: unpaid, partially paid, or paid.
- Fulfillment: not processed, assigned/carried by PIC, received by buyer, or
  problematic.
- PIC remittance: not remitted, remitted, or audited.

These are independent states. For example, an order may be received by the
buyer but still unpaid, or paid but not yet delivered.

## Google Form Integration Finding

The intake source is confirmed as Google Forms linked to a Google Sheet.

Three integration levels are possible:

1. Manual incremental sync from the response Sheet. An operator presses a sync
   action; only responses with unseen source IDs are imported. This is the
   accepted MVP boundary because it removes retyping and prevents repeated
   imports without requiring event infrastructure.
2. Scheduled near-real-time sync. The application checks for new rows every few
   minutes. This is a reasonable follow-up after manual sync is reliable.
3. Push notifications from Google Forms. Google's official approach uses Forms
   API watches and Cloud Pub/Sub; notifications may arrive within minutes, do
   not contain response details, and require a separate response fetch. Watches
   also expire and must be renewed. This is intentionally excluded from MVP.

Whichever sync is selected, imported records need an immutable external source
ID and a recorded import timestamp. Re-running sync must update or skip the same
source record rather than create a duplicate.

## Facts Versus Assumptions

### Facts

- The coordinator needs centralized tracking for repeated fund-raising work.
- Committee participation and sales attribution must be recorded.
- Sales require payment and pickup/fulfillment tracking.
- Existing spreadsheets and committee data can serve as migration and domain
  references.
- Mobile usability is a first-class constraint.
- Regional PICs need to update fulfillment and payment progress during delivery.
- Officers consume the completed report but do not modify operational data.
- Every activity has exactly one product and exactly one selected operating
  mode: campus sale or regional distribution.
- Existing Nasi Jaha records are test evidence, not trusted production data for
  automatic migration.
- The application is online-first; full offline operation is not required.

### Assumptions To Validate

- A single FILKOM Day organization is enough; multi-organization support is not
  needed.
- Individual coordinator, deputy, and fund-raising member accounts plus a
  view-only officer account are sufficient for the first release.
- Committee members are selected from a controlled master list instead of typed
  freely into every sale.
- Each financial correction needs an audit trail.
- A fund-raising activity can be closed only after sales, fulfillment, and money
  are reconciled.
- Existing Google Sheets will become reference or future migration sources
  rather than remain a second writable source of truth.
- The same transaction model can represent both regional and campus workflows.
- The response spreadsheet can provide a stable unique source identifier for
  idempotent imports; this still requires verification against the actual form
  response structure.
- A local new-entry draft and explicit retry are sufficient for weak-network
  use; this must be validated on target mobile devices.

## Candidate Smallest Useful Version

For one new fund-raising activity:

1. The coordinator, deputy, and each fund-raising member sign in with individual
   accounts; officers receive view-only access.
2. The coordinator creates a one-product activity with selling price, capital,
   quantity target, period, and operating mode.
3. An operator performs an incremental import from a linked Google Form response
   Sheet using a committee master list and immutable source IDs for duplicate
   prevention. Manual entry remains available for exceptions.
4. Each sale tracks quantity, attributed relationship, buyer, payment
   state/method, fulfillment state, PIC, and activity-specific location data.
5. The activity view shows quantity, expected revenue, collected money,
   outstanding money, and unresolved orders.
6. The coordinator resolves discrepancies and closes the activity with an Excel
   (`.xlsx`) export of its final data.
7. On weak connections, a new manual entry can remain as a visible local draft
   until submission succeeds; unsynced data must never appear audited or final.

This candidate deliberately proves one complete operational loop before adding
advanced dashboards or broad automation.

## Candidate Non-Goals

- A buyer-facing form inside the application; buyers continue using Google
  Forms during the first release.
- Automatic bank or e-wallet verification.
- Full organizational accounting or bookkeeping.
- Multi-campus or multi-organization tenancy.
- Advanced inventory, procurement, or route optimization.
- Elaborate analytics before core totals are trustworthy.
- A fixed official final-report format before the treasurer defines its rules.
- Editing the original Google Sheets from the application in both directions.
- Automatic or push-based Google Forms synchronization.
- Full offline browsing, background synchronization, or offline editing of
  existing financial records.
- Importing the existing Nasi Jaha spreadsheet as trusted production history.
- Google Sign-In or another third-party identity provider.
- Storing payment-proof file contents in the application database.
- Browser-local login blocking that can be bypassed by restarting the browser.

## Current Risks

- Ambiguous order and payment states can produce a polished interface with
  untrustworthy totals.
- Multiple editors handling financial data require permissions and an audit
  trail, even for a small internal application.
- Buyer identity, contact, address, map, and payment-proof data create ongoing
  privacy obligations across both application access and Google Drive sharing.
- Long-term Google Drive retention requires private sharing rules and a manual
  deletion/revocation process; public proof links are not acceptable.
- Permanent account lockout can be abused to deny access, so the five-failure
  lock must expire automatically or be released by an administrator.
- Copying the spreadsheet layout too literally may preserve spreadsheet problems
  and make mobile use worse.
- A Google Form response row may lack a robust immutable identifier in the
  linked Sheet. Using only row position or buyer name for deduplication would be
  unsafe; the actual response structure must be verified before integration is
  committed.
- Automatic push synchronization would add Google Cloud configuration, watch
  renewal, response fetching, failure recovery, and operational ownership that
  are disproportionate to the MVP.
- Unknown reporting rules can expand scope late unless export is isolated from
  the core transaction model.

## Decision Gate

Proceed. The project owner approved this report on 2026-07-21. The idea is
supported by real workflow evidence, its primary users and pain are specific,
the MVP completes one useful operating loop, and risky expansions are explicitly
deferred. The actual Google Form response structure must be inspected later
before implementing synchronization.

## Sources Read

- `IDE PROJECT.txt` - initial project idea and intended flow.
- `docs/ai-native/00-process-setup.md` - agreed engineering process and
  guardrails.
- `docs/ai-native/00-source-inventory.md` - verified Google Sheets structures
  and sensitive-data inventory.
- Google Sheets sales template and committee data previously inspected through
  the connected Google Sheets source.
- Official Google Forms API push-notification, Apps Script form-submit trigger,
  and Google Sheets API documentation reviewed for integration feasibility.
