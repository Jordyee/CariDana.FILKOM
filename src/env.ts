export interface AppBindings {
  ASSETS: Fetcher;
  /** Supplied by the local test harness; unconfigured deployments fail closed.
   * A real binding requires the later isolated-environment/deployment gate. */
  DB?: D1Database;
}
