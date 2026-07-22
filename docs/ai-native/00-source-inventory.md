# Source Inventory

## Local Source

- `IDE PROJECT.txt`
  - Contains the initial app idea.
  - Describes a mobile-first web app for centralized fund-raising records,
    sales tracking, committee contribution tracking, financial reports,
    dashboard summaries, and future report export.

## Google Sheets Source: Sales Template

- Title: `Tempelate penjualn`
- Spreadsheet ID: `1lTf9rrYjOIfH3Cy4nU4_TwXFVOnJjpL-pAd8l08g_6M`
- Time zone: `Asia/Makassar`
- Status: readable through Google Sheets connector.

### Verified Tabs

- `PLAN & REPORT`
  - Product and pricing summary.
  - Target, total income, capital, profit, payment method summary, and issue report sections.
- `SALES`
  - General sales records.
  - Key fields include division, committee member name, quantity, pickup status,
    total, payment method, proof, buyer name, and notes.
- `MNT - BTG`
  - Sales records for Minut and Bitung areas.
  - Includes area, address/map link, buyer name, and phone/WhatsApp fields.
- `MND -TMHN`
  - Sales records for Manado and Tomohon areas.
  - Includes area, address/map link, buyer name, and phone/WhatsApp fields.
- `Perlu Konfirmasi`
  - Orders needing confirmation.
  - Includes notes and incomplete/uncertain fulfillment information.

## Google Sheets Source: Committee Data

- Title: `Copy of Struktur Panitia Filkom Day 2026`
- Spreadsheet ID: `1tZnjivHVhn-dnKbn7cWSeS4V0vLTGzdgKHS5Y48J2ws`
- Status: readable through Google Sheets connector.

### Verified Tabs

- `Data Anggota Per Divisi - TERBARU `
  - Main current committee structure.
  - Key fields include number, name, role, division, and total per division.
  - Total committee members shown: 70.
- `Data Anggota Per Divisi - LAMA`
  - Hidden old tab.
  - Not used for initial planning unless requested.

## Sensitive Data Notice

The spreadsheets include personally identifiable and financial information:

- buyer names
- committee member names
- phone/WhatsApp numbers
- addresses and map links
- payment methods
- proof/payment status
- sales totals

Future product requirements must include role-based access, privacy boundaries,
and careful handling of exports.

## Google Forms Response Source

- Title: `cardan nasi jaha`
- Spreadsheet ID: `1HmC15FBgAm5H9hx1668aBtrgQl5Ol3t4aTk_zPBmY6g`
- Status: readable through the Google Sheets connector; inspected read-only on
  2026-07-21.
- Tab: `Form Responses 1` (`sheetId` 328013160)
- Grid: 145 rows x 15 columns; header row frozen.
- Verified header categories: timestamp, committee member, buyer name, buyer
  phone, map/location, region, quantity, payment method, payment proof, notes,
  and one ambiguous `Column 1` field.
- No `Order ID` header currently exists. Current trailing empty columns can host
  a test ID column, but the behavior must first be verified on a copy.
- This source contains buyer PII and payment evidence. Only headers were read for
  clarification; buyer rows were not loaded.
