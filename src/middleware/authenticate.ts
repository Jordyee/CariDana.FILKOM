import type { Context, MiddlewareHandler } from "hono";
import type { AppBindings } from "../env";
import { clearSessionCookie, readSessionCookie, SessionService } from "../auth/session";
import type { ResolvedSession } from "../repositories/sessions";

export type SessionEnv = {
  Bindings: AppBindings;
  Variables: { session: ResolvedSession; sessionToken: string; sessions: SessionService };
};

export function authenticationDenied(c: Context<SessionEnv>, clear = false) {
  if (clear) c.header("Set-Cookie", clearSessionCookie());
  return c.json({ error: "Autentikasi diperlukan." }, 401);
}

export function authenticate(clock: () => number): MiddlewareHandler<SessionEnv> {
  return async (c, next) => {
    const token = readSessionCookie(c.req.raw);
    if (!token || !c.env.DB || new URL(c.req.url).protocol !== "https:") {
      // Cross-site POSTs omit a Lax cookie. Clearing it here would let an
      // unauthenticated form submission log the browser out (logout CSRF).
      return authenticationDenied(c);
    }
    const sessions = new SessionService(c.env.DB, clock);
    const session = await sessions.resolve(token);
    if (!session) return authenticationDenied(c, true);
    c.set("session", session);
    c.set("sessionToken", token);
    c.set("sessions", sessions);
    await next();
    // Denied/failed/unknown requests and logout must not prolong a session.
    // Conditional SQL also prevents an overlapping revocation from being undone.
    if (!c.error && c.res.status >= 200 && c.res.status < 400) await sessions.touch(session.id);
  };
}

export const requireNormalSession: MiddlewareHandler<SessionEnv> = async (c, next) => {
  const session = c.get("session");
  if (session.restricted !== 0 || session.mustChangePassword !== 0) return authenticationDenied(c);
  await next();
};
