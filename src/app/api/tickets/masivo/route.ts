import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/tickets/masivo { ids[], patch: { estado?, prioridad?, asignado_a? } }
// Aplica actualización masiva; cada fila pasa por RLS + triggers (transiciones,
// permisos). Devuelve conteo de éxitos y errores por id.
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (rateLimited(`masivo:${user.id}`, 5)) {
    return NextResponse.json({ error: "Límite excedido: 5/min" }, { status: 429 });
  }
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId || !canWrite(memberships?.[0]?.tenant_role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  const { ids, patch } = (await request.json()) as {
    ids?: string[]; patch?: { estado?: string; prioridad?: string; asignado_a?: string | null };
  };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
    return NextResponse.json({ error: "ids inválidos (1-50)" }, { status: 400 });
  }
  const clean: Record<string, string | null> = {};
  if (patch?.estado && ["abierto", "en_proceso", "pendiente", "resuelto", "cerrado"].includes(patch.estado)) clean.estado = patch.estado;
  if (patch?.prioridad && ["baja", "media", "alta", "urgente"].includes(patch.prioridad)) clean.prioridad = patch.prioridad;
  if (patch && "asignado_a" in patch) clean.asignado_a = patch.asignado_a || null;
  if (Object.keys(clean).length === 0) return NextResponse.json({ error: "Sin cambios válidos" }, { status: 400 });
  if (clean.estado === "cerrado") clean.closed_at = new Date().toISOString();

  let ok = 0;
  const errores: { id: string; error: string }[] = [];
  for (const id of ids) {
    const { error } = await supabase.from("tickets").update(clean).eq("id", id).eq("organization_id", orgId);
    if (error) errores.push({ id, error: error.message });
    else ok++;
  }
  return NextResponse.json({ ok, errores });
}
