import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/notificaciones/count → { total } pendientes accionables del tenant.
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { data: memberships } = await supabase.from("organization_members").select("org_id").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ total: 0 });

  const [{ count: vencidos }, { count: porAprobar }] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("organization_id", orgId)
      .in("estado", ["abierto", "en_proceso", "pendiente"]).lt("sla_vence", new Date().toISOString()),
    supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("organization_id", orgId).neq("estado", "aprobado"),
  ]);
  return NextResponse.json({ total: (vencidos ?? 0) + (porAprobar ?? 0), vencidos, porAprobar });
}
