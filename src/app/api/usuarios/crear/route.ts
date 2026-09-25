import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/usuarios/crear { email, password, tenant_role }
// Solo owner/admin (users.manage). Crea el usuario Auth con contraseña
// (email ya confirmado) + membresía. Requiere SUPABASE_SERVICE_ROLE_KEY en servidor.
export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Servidor sin SERVICE_ROLE configurado" }, { status: 500 });

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { data: mine } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = mine?.[0]?.org_id as string | undefined;
  if (!orgId || !["owner", "admin"].includes(mine?.[0]?.tenant_role)) {
    return NextResponse.json({ error: "Requiere rol owner/admin" }, { status: 403 });
  }

  const { email, password, tenant_role } = (await request.json()) as {
    email?: string; password?: string; tenant_role?: string;
  };
  if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  if (!password || password.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });
  if (!["owner", "admin", "manager", "employee", "viewer", "client"].includes(tenant_role ?? "")) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { created_by: user.id },
  });
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

  const { error: mErr } = await admin.from("organization_members").insert({
    org_id: orgId, user_id: created.user.id, tenant_role, status: "active",
  });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });
  return NextResponse.json({ ok: true, user_id: created.user.id });
}
