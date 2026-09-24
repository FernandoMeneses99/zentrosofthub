import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/firma/webhook — eventos del proveedor de firma (Documenso).
// Verifica HMAC con FIRMA_WEBHOOK_SECRET cuando está configurado.
// Sin secreto: solo acepta si el evento trae organization_id válido (modo dev).
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.FIRMA_WEBHOOK_SECRET;
  if (secret) {
    const { createHmac, timingSafeEqual } = await import("crypto");
    const sig = request.headers.get("x-firma-signature") ?? "";
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }
  let evt: { external_id?: string; estado?: string; organization_id?: string };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!evt.external_id || !evt.organization_id) {
    return NextResponse.json({ error: "external_id y organization_id requeridos" }, { status: 400 });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const estado = ["firmado", "rechazado", "expirado"].includes(evt.estado ?? "") ? evt.estado! : "enviado";
  const { error } = await admin.from("signing_requests").update({ estado })
    .eq("external_id", evt.external_id).eq("organization_id", evt.organization_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
