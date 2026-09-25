import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// POST /api/tickets/crear { titulo, descripcion, prioridad }
// Para clientes: auto-vincula su contacto por email y asigna su empresa.
// Para staff: usa company_id del body.
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  const role = memberships?.[0]?.tenant_role as string | undefined;
  if (!orgId) return NextResponse.json({ error: "Sin organización" }, { status: 403 });

  const { titulo, descripcion, prioridad, company_id } = (await request.json()) as {
    titulo?: string; descripcion?: string; prioridad?: string; company_id?: string;
  };
  if (!titulo || titulo.trim().length < 3) return NextResponse.json({ error: "Título mínimo 3 caracteres" }, { status: 400 });
  if (!["baja", "media", "alta", "urgente"].includes(prioridad ?? "")) {
    return NextResponse.json({ error: "Prioridad inválida" }, { status: 400 });
  }

  let company: string | null = company_id ?? null;
  if (role === "client") {
    const { data } = await supabase.rpc("vincular_mi_contacto");
    company = (data as string | null) ?? null;
    if (!company) {
      return NextResponse.json({
        error: "No encontramos tu empresa. Pide al owner que registre tu contacto con este email: " + user.email,
      }, { status: 400 });
    }
  }

  const { data: ticket, error } = await supabase.from("tickets").insert({
    organization_id: orgId, titulo: titulo.trim(), descripcion: (descripcion ?? "").trim() || null,
    prioridad, company_id: company, created_by: user.id,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: ticket.id, company_id: company });
}
