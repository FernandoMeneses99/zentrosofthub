import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canApprove } from "@/lib/access";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/horas/masivo { ids[], estado: "aprobado" | "rechazado" }
// Cada fila pasa por RLS + triggers (007 aprobación, mes cerrado).
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (rateLimited(`horas-masivo:${user.id}`, 5)) {
    return NextResponse.json({ error: "Límite excedido: 5/min" }, { status: 429 });
  }
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId || !canApprove(memberships?.[0]?.tenant_role)) {
    return NextResponse.json({ error: "Requiere time.approve" }, { status: 403 });
  }
  const { ids, estado } = (await request.json()) as { ids?: string[]; estado?: string };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
    return NextResponse.json({ error: "ids inválidos (1-50)" }, { status: 400 });
  }
  if (!["aprobado", "rechazado"].includes(estado ?? "")) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  let ok = 0;
  const errores: { id: string; error: string }[] = [];
  for (const id of ids) {
    const { error } = await supabase.from("time_entries").update({
      estado, approved_by: user.id, approved_at: new Date().toISOString(),
    }).eq("id", id).eq("organization_id", orgId);
    if (error) errores.push({ id, error: error.message });
    else ok++;
  }
  return NextResponse.json({ ok, errores });
}
