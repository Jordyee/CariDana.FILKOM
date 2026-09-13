import { Hono } from "hono";
import type { SessionEnv } from "../middleware/authenticate";
import { clearSessionCookie, csrfToken } from "../auth/session";

/** Mount only behind authentication and CSRF middleware, including restricted sessions. */
export const authRoutes = new Hono<SessionEnv>();
authRoutes.get("/csrf", async (c) => c.json({ csrfToken: await csrfToken(c.get("sessionToken")) }));
authRoutes.post("/logout", async (c) => {
  await c.get("sessions").revoke(c.get("session").id);
  c.header("Set-Cookie", clearSessionCookie());
  return c.body(null, 204);
});
