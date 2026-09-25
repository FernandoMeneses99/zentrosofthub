import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/in/github?org=<uuid> — webhook push de GitHub.
// Verifica X-Hub-Signature-256 con el secreto guardado en integraciones(provider=github).
// Auto-vincula commits cuyo mensaje traiga hub-<8 primeros del ticket id>.
export async function POST(request: Request) {
  const raw = await request.text();
  const orgId = new URL(request.url).searchParams.get("org");
  if (!orgId) return NextResponse.json({ error: "Falta ?org=" }, { status: 400 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Sin service key" }, { status: 500 });
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: integ } = await admin.from("integraciones").select("config,activo")
    .eq("organization_id", orgId).eq("provider", "github").single();
  const secret = (integ?.activo ? (integ.config as { secret?: string })?.secret : null) ?? null;
  if (!secret) return NextResponse.json({ error: "GitHub no configurado para esta org" }, { status: 400 });

  const { createHmac, timingSafeEqual } = await import("crypto");
  const sig = request.headers.get("x-hub-signature-256") ?? "";
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let body: { commits?: { id: string; message: string; url: string }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  let vinculados = 0;
  for (const c of body.commits ?? []) {
    const m = /hub-([0-9a-f]{8})/i.exec(c.message ?? "");
    if (!m) continue;
    const { data: t } = await admin.from("tickets").select("id")
      .eq("organization_id", orgId).ilike("id", `${m[1]}%`).limit(1).single();
    if (!t) continue;
    const { error } = await admin.from("ticket_links").insert({
      organization_id: orgId, ticket_id: t.id, tipo: "commit",
      url: c.url, ref: c.id.slice(0, 7),
    });
    if (!error) vinculados++;
  }
  return NextResponse.json({ ok: true, vinculados });
}
