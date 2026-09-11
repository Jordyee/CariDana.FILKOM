import { configDefaults, defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  // This filesystem/CLI suite runs under Node via test:privacy-scan. Preserve
  // Vitest's default discovery for every other present and future test file.
  test: { exclude: [...configDefaults.exclude, "test/privacy/artifact-scan.test.mjs"] },
  plugins: [cloudflareTest(async () => ({
    main: "./src/index.ts",
    wrangler: { configPath: "./wrangler.jsonc" },
    // Runtime-level deny applies even if application code captures native fetch.
    // Return a constant response so URLs/headers cannot leak through errors.
    miniflare: {
      // Disposable test-only databases; no D1 resource or runtime binding.
      d1Databases: ["TEST_DB", "TEST_UPGRADE_DB", "TEST_ROLLBACK_DB"],
      bindings: { TEST_MIGRATIONS: await readD1Migrations("./migrations") },
      outboundService: () => new Response("TEST_NETWORK_BLOCKED", { status: 599 }),
    },
  }))],
});
