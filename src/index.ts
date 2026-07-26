import { Hono } from "hono";
import { issueSyntheticSessionCookie } from "./auth";
import { createSyntheticWorkbook } from "./workbook";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (context) => context.json({ ok: true, scope: "synthetic compatibility spike" }));

app.post("/api/d1-probe", async (context) => {
  const marker = "synthetic-probe";
  await context.env.DB.prepare("INSERT INTO spike_probe (marker) VALUES (?)").bind(marker).run();
  const result = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM spike_probe WHERE marker = ?").bind(marker).first<{ count: number }>();
  return context.json({ count: result?.count ?? 0 });
});

app.post("/api/session-probe", async (context) => {
  context.header("Set-Cookie", await issueSyntheticSessionCookie());
  return context.json({ ok: true });
});

app.get("/api/report-probe.xlsx", (context) => new Response(createSyntheticWorkbook(), {
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": 'attachment; filename="synthetic-compatibility-proof.xlsx"',
    "Cache-Control": "no-store",
  },
}));

app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));

export default app;
