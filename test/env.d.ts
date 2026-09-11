import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_DB: D1Database;
      TEST_UPGRADE_DB: D1Database;
      TEST_ROLLBACK_DB: D1Database;
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
