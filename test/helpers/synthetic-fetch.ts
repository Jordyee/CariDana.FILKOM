// Deliberately never delegates to fetch, even for an unregistered invalid URL.
export function syntheticFetch(responses: ReadonlyMap<string, string>): typeof fetch {
  for (const address of responses.keys()) {
    let url: URL;
    try { url = new URL(address); } catch { throw new Error("SYNTHETIC_TARGET_REQUIRED"); }
    if (url.protocol !== "https:" || !url.hostname.endsWith(".invalid") || url.username || url.password) {
      throw new Error("SYNTHETIC_TARGET_REQUIRED");
    }
  }
  return (async (input: RequestInfo | URL) => {
    const address = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = responses.get(address);
    if (body === undefined) throw new Error("TEST_NETWORK_BLOCKED");
    return new Response(body, { headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}
