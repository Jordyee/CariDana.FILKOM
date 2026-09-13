import type { MiddlewareHandler } from "hono";
import type { SessionEnv } from "./authenticate";
import { verifyCsrfToken } from "../auth/session";

export const csrf: MiddlewareHandler<SessionEnv> = async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "HEAD") return next();
  const origin = c.req.header("Origin");
  const site = c.req.header("Sec-Fetch-Site");
  if (origin !== new URL(c.req.url).origin || (site !== undefined && site !== "same-origin")
    || !await verifyCsrfToken(c.get("sessionToken"), c.req.header("X-CSRF-Token") ?? "")) {
    return c.json({ error: "Permintaan ditolak." }, 403);
  }
  await next();
};
