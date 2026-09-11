import { describe, expect, it } from "vitest";
import { allOrders, axes, corrections, financeActivities, type FixtureOrder } from "../fixtures/catalog";
import { expectedFinance } from "../fixtures/expected-finance";

function syntheticOrder(input: FixtureOrder): boolean {
  const strings = [input.id, input.picId, input.actorId, input.attribution.divisionId];
  if (!strings.every((value) => value.startsWith("synthetic-"))) return false;
  if (!/^Pembeli Sintetis [a-z0-9-]+$/.test(input.buyer.name)) return false;
  if (!/^SYNTHETIC-PHONE-[a-z0-9-]+$/.test(input.buyer.phone)) return false;
  if (input.attribution.memberId && !input.attribution.memberId.startsWith("synthetic-")) return false;
  if (input.source.type === "manual") {
    if (!input.source.idempotencyKey.startsWith("synthetic-") || "sheetId" in input.source || "row" in input.source) return false;
  } else if (!input.source.sheetId.startsWith("synthetic-sheet-")) return false;
  const urls = [input.proofUrl];
  if ("address" in input.location) {
    if (!/^ALAMAT-SINTETIS-[a-z0-9-]+$/.test(input.location.address)) return false;
    if (!input.location.area.startsWith("Wilayah Sintetis ")) return false;
    urls.push(input.location.mapUrl);
  } else if (!input.location.pickupPoint.startsWith("Titik Sintetis ")) return false;
  return urls.every((value) => {
    if (value === null) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.endsWith(".invalid") && !url.username && !url.password && /^\/synthetic-[a-z0-9-]+$/.test(url.pathname) && !url.search && !url.hash;
    } catch { return false; }
  });
}

describe("sanitized fixture contract", () => {
  it("uses only visibly synthetic identities and reserved invalid references", () => {
    expect(allOrders.every(syntheticOrder)).toBe(true);
    expect(new Set(allOrders.map((order) => order.id)).size).toBe(allOrders.length);
    expect(new Set(financeActivities.map((activity) => activity.mode))).toEqual(new Set(["campus", "regional"]));
    for (const activity of financeActivities) {
      expect(activity.product).toBe("Nasi Jaha Sintetis");
      for (const order of activity.orders) {
        expect("pickupPoint" in order.location).toBe(activity.mode === "campus");
      }
    }
  });

  it("rejects unsanctioned identity, source, contact and URL canaries without echo", () => {
    const clean = allOrders[0];
    const badPhone = "+62" + "80000000000";
    const badAddress = ["CANARY", "UNAPPROVED", "ADDRESS"].join("-");
    const cases: FixtureOrder[] = [
      { ...clean, buyer: { ...clean.buyer, name: "CANARY-UNAPPROVED-NAME" } },
      { ...clean, buyer: { ...clean.buyer, phone: badPhone } },
      { ...clean, location: { area: "Wilayah Sintetis A", address: badAddress, mapUrl: "https://maps.example.invalid/synthetic-a" } },
      { ...clean, proofUrl: "https://example.invalid.attacker.test/synthetic-a" },
      { ...clean, proofUrl: "https://proof.example.invalid/synthetic-a?buyer=canary" },
      { ...clean, source: { type: "form_sync", sheetId: "CANARY-NON-SYNTHETIC-ID", row: 2 } },
    ];
    for (const value of cases) expect(syntheticOrder(value)).toBe(false);
  });

  it("covers every approved state on each independent axis", () => {
    for (const key of Object.keys(axes) as (keyof typeof axes)[]) {
      expect(new Set(allOrders.map((order) => order.states[key]))).toEqual(new Set(axes[key]));
    }
    expect(allOrders.some((order) => order.states.fulfillment === "received" && order.states.payment === "partially_paid")).toBe(true);
    expect(allOrders.some((order) => order.states.payment === "paid" && order.states.remittance === "not_remitted")).toBe(true);
  });

  it("retains issue/correction/approval and blocked versus closed evidence", () => {
    for (const correction of corrections) {
      expect(allOrders.some((order) => order.id === correction.orderId)).toBe(true);
      expect<string>(correction.before).not.toBe(correction.after);
      expect(correction.reason.length > 0 && correction.actorId.startsWith("synthetic-")).toBe(true);
      expect(Number.isFinite(Date.parse(correction.occurredAt))).toBe(true);
      if (correction.field === "states.order") {
        expect(correction.approvedBy).toBe("synthetic-coordinator");
        expect(correction.approvedAt).not.toBeNull();
      }
    }
    expect(financeActivities[0].closure.expectedBlockers).toEqual(["outstanding_payment", "unremitted_money", "open_issue"]);
    expect(financeActivities[1].closure.expectedBlockers).toEqual([]);
    expect(financeActivities[1].closure.closedBy).toBe("synthetic-coordinator");
    expect(financeActivities[1].approvedLosses[0].approvedBy).toBe("synthetic-deputy");
  });

  it("checks hand-declared totals with independent test-only arithmetic", () => {
    for (const activity of financeActivities) {
      // Only received confirmed orders: no guess about debt before delivery.
      expect(activity.orders.every((order) => order.states.order === "confirmed" && order.states.fulfillment === "received")).toBe(true);
      let received = 0, collected = 0, remitted = 0;
      for (const order of activity.orders) {
        expect([order.quantity, order.receivedQuantity, order.collectedRp, order.remittedRp].every(Number.isSafeInteger)).toBe(true);
        received += order.receivedQuantity;
        collected += order.collectedRp;
        remitted += order.remittedRp;
      }
      const expected = expectedFinance[activity.id];
      expect(received * activity.sellingPriceRp).toBe(expected.recognizedRp);
      expect(collected).toBe(expected.collectedRp);
      expect(received * activity.sellingPriceRp - collected).toBe(expected.outstandingRp);
      expect(remitted).toBe(expected.remittedRp);
      expect(activity.purchasePriceRp * activity.targetQuantity + activity.additionalCosts.reduce((sum, cost) => sum + cost.amountRp, 0)).toBe(expected.capitalRp);
      expect(activity.approvedLosses.reduce((sum, loss) => sum + loss.amountRp, 0)).toBe(expected.approvedLossRp);
    }
  });
});
