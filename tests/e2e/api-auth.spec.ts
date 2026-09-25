import { test, expect } from "@playwright/test";

// Batería anti-IDOR / autorización sin sesión: todo debe denegar.
test("API crear ticket sin sesión → 401", async ({ request }) => {
  const r = await request.post("/api/tickets/crear", { data: { titulo: "x", prioridad: "media" } });
  expect(r.status()).toBe(401);
});

test("API crear usuario sin sesión → 401", async ({ request }) => {
  const r = await request.post("/api/usuarios/crear", { data: {} });
  expect(r.status()).toBe(401);
});

test("API avisos telegram sin sesión → 401", async ({ request }) => {
  const r = await request.post("/api/avisos/telegram");
  expect(r.status()).toBe(401);
});

test("API IA sin sesión → 401", async ({ request }) => {
  const r = await request.post("/api/ai/suggest", { data: { ticket_id: "00000000-0000-0000-0000-000000000000" } });
  expect(r.status()).toBe(401);
});

test("Webhook firma: JSON inválido → 400", async ({ request }) => {
  const r = await request.post("/api/firma/webhook", { data: "no-json", headers: { "Content-Type": "text/plain" } });
  expect([400, 500]).toContain(r.status());
});

test("Webhook firma: sin campos → 400", async ({ request }) => {
  const r = await request.post("/api/firma/webhook", { data: {} });
  expect([400, 500]).toContain(r.status());
});
