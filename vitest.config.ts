import { configDefaults, defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  // This filesystem/CLI suite runs under Node via test:privacy-scan. Preserve
  // Vitest's default discovery for every other present and future test file.
  test: { exclude: [...configDefaults.exclude, "test/privacy/artifact-scan.test.mjs"] },
  plugins: [cloudflareTest({
    main: "./src/index.ts",
    wrangler: { configPath: "./wrangler.jsonc" },
    // Runtime-level deny applies even if application code captures native fetch.
    // Return a constant response so URLs/headers cannot leak through errors.
    miniflare: {
      outboundService: () => new Response("TEST_NETWORK_BLOCKED", { status: 599 }),
    },
  })],
});
