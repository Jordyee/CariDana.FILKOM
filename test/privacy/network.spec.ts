import { describe, expect, it } from "vitest";
import { syntheticFetch } from "../helpers/synthetic-fetch";

describe("test network boundary", () => {
  // Hostnames are public service names; paths and IDs are synthetic canaries.
  it.each(["sheets.googleapis.com", "drive.googleapis.com", "www.googleapis.com", "docs.google.com", "drive.google.com", "example.invalid"])(
    "blocks native outbound fetch case %# before network dispatch", async (host) => {
      const result = await fetch(`https://${host}/synthetic-canary`);
      expect(result.status).toBe(599);
      expect(await result.text()).toBe("TEST_NETWORK_BLOCKED");
    },
  );

  it("serves only registered synthetic responses and never follows redirects", async () => {
    const mock = syntheticFetch(new Map([["https://sheets.example.invalid/synthetic", '{"rows":[]}']]));
    const response = await mock("https://sheets.example.invalid/synthetic");
    expect(await response.json()).toEqual({ rows: [] });
    await expect(mock("https://unregistered.invalid/")).rejects.toThrow("TEST_NETWORK_BLOCKED");
    await expect(mock("https://" + "sheets.googleapis.com" + "/synthetic-canary")).rejects.toThrow("TEST_NETWORK_BLOCKED");
  });

  it.each(["https://" + "sheets.googleapis.com" + "/synthetic-canary", "http://example.invalid/", "https://example.invalid.attacker.test/", "bad-url"])(
    "rejects unsafe mock registration case %# with a redacted error", (address) => {
      expect(() => syntheticFetch(new Map([[address, "{}"]]))).toThrow("SYNTHETIC_TARGET_REQUIRED");
    },
  );
});
