import { Hono } from "hono";
import type { AppBindings } from "./env";
import { authenticate, requireNormalSession, type SessionEnv } from "./middleware/authenticate";
import { csrf } from "./middleware/csrf";
import { authRoutes } from "./routes/auth";

/** Later product routes are appended here and inherit normal-session enforcement. */
export function createSessionApi(clock: () => number = Date.now) {
  const api = new Hono<SessionEnv>();
  api.use("*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    c.header("Pragma", "no-cache");
    await next();
  });
  api.onError((_error, c) => c.json({ error: "Permintaan tidak dapat diproses." }, 500));
  api.use("*", authenticate(clock), csrf);
  api.route("/auth", authRoutes);
  api.use("*", requireNormalSession);
  return api;
}

export function createApp(clock: () => number = Date.now) {
  const app = new Hono<{ Bindings: AppBindings }>();
  app.onError((_error, c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ error: "Permintaan tidak dapat diproses." }, 500);
  });
  app.route("/api", createSessionApi(clock));
  // Authenticated unknown API paths must never fall through to static assets.
  app.all("/api/*", (c) => c.json({ error: "Tidak ditemukan." }, 404));
  app.all("/api", (c) => c.json({ error: "Tidak ditemukan." }, 404));
  app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));
  return app;
}

export const app = createApp();
