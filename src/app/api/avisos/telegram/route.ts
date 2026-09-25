import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/access";
import { sendTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// POST /api/avisos/telegram → envía resumen operativo (vencidos + sin aprobar).
// Solo owner/admin. Pensado para cron (Vercel Cron) o botón manual.
export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId || !isAdmin(memberships?.[0]?.tenant_role)) {
    return NextResponse.json({ error: "Solo owner/admin" }, { status: 403 });
  }
  const now = new Date().toISOString();
  const [{ data: vencidos }, { count: porAprobar }] = await Promise.all([
    supabase.from("tickets").select("id,titulo,prioridad").eq("organization_id", orgId)
      .in("estado", ["abierto", "en_proceso", "pendiente"]).lt("sla_vence", now).limit(10),
    supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("organization_id", orgId).neq("estado", "aprobado"),
  ]);
  const lines = [
    `<b>Zentrosoft Hub — resumen</b>`,
    `Vencidos: ${vencidos?.length ?? 0} · Horas por aprobar: ${porAprobar ?? 0}`,
    ...(vencidos ?? []).slice(0, 5).map((t) => `• [${t.prioridad}] ${t.titulo}`),
  ];
  const sent = await sendTelegram(lines.join("\n"));
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 500 });
  return NextResponse.json({ ok: true, vencidos: vencidos?.length ?? 0, porAprobar });
}
