import { Hono } from "hono";
import type { AppBindings } from "./env";

export const app = new Hono<{ Bindings: AppBindings }>();

app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));
