import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("CariDana.FILKOM Worker foundation", () => {
  it("serves the Vite-built static client", async () => {
    const asset = await SELF.fetch("https://example.test/");
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain("CariDana.FILKOM");
  });

  it.each(["/api/health", "/api/d1-probe", "/api/session-probe", "/api/report-probe.xlsx"])(
    "does not expose the retired spike route %s",
    async (path) => {
      const response = await SELF.fetch(`https://example.test${path}`);
      expect(response.status).toBe(404);
    },
  );
});
