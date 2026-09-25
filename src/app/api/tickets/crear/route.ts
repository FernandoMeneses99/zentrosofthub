import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/tickets/crear { titulo, descripcion, prioridad }
// Para clientes: auto-vincula su contacto por email y asigna su empresa.
// Para staff: usa company_id del body.
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (rateLimited(`ticket-crear:${user.id}`, 20)) {
    return NextResponse.json({ error: "Límite excedido: 20/min" }, { status: 429 });
  }
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  const role = memberships?.[0]?.tenant_role as string | undefined;
  if (!orgId) return NextResponse.json({ error: "Sin organización" }, { status: 403 });

  const { titulo, descripcion, prioridad, categoria, company_id } = (await request.json()) as {
    titulo?: string; descripcion?: string; prioridad?: string; categoria?: string; company_id?: string;
  };
  if (!titulo || titulo.trim().length < 3) return NextResponse.json({ error: "Título mínimo 3 caracteres" }, { status: 400 });
  if (!["baja", "media", "alta", "urgente"].includes(prioridad ?? "")) {
    return NextResponse.json({ error: "Prioridad inválida" }, { status: 400 });
  }
  const cat = ["soporte", "incidencia", "solicitud", "mantenimiento", "otro"].includes(categoria ?? "") ? categoria! : "soporte";

  let company: string | null = company_id ?? null;
  if (role === "client") {
    const { data, error: rpcErr } = await supabase.rpc("vincular_mi_contacto");
    if (rpcErr) {
      return NextResponse.json({
        error: `Fallo el vínculo automático (${rpcErr.message}). Verifica que las migraciones 033/035 estén aplicadas.`,
      }, { status: 500 });
    }
    company = (data as string | null) ?? null;
    // Fallback con service_role: busca el contacto por email en tu organización.
    if (!company && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: c } = await admin.from("contacts").select("id,company_id")
        .eq("organization_id", orgId).ilike("email", user.email ?? "").is("deleted_at", null)
        .not("company_id", "is", null).limit(1).single();
      if (c?.company_id) {
        await admin.from("contacts").update({ user_id: user.id }).eq("id", c.id).is("user_id", null);
        company = c.company_id as string;
      }
    }
    if (!company) {
      return NextResponse.json({
        error: "No encontramos tu empresa. Pide al owner que registre tu contacto con este email: " + user.email,
      }, { status: 400 });
    }
  }

  const { data: ticket, error } = await supabase.from("tickets").insert({
    organization_id: orgId, titulo: titulo.trim(), descripcion: (descripcion ?? "").trim() || null,
    prioridad, categoria: cat, company_id: company, created_by: user.id,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: ticket.id, company_id: company });
}
