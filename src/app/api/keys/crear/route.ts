import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/access";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/keys/crear { nombre } → crea API key (solo owner/admin).
// Retorna el valor UNA VEZ; en DB solo queda el hash.
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (rateLimited(`key:${user.id}`, 5)) return NextResponse.json({ error: "Límite excedido" }, { status: 429 });
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId || !isAdmin(memberships?.[0]?.tenant_role)) {
    return NextResponse.json({ error: "Solo owner/admin" }, { status: 403 });
  }
  const { nombre } = (await request.json()) as { nombre?: string };
  if (!nombre || nombre.trim().length < 2) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });

  const { randomBytes, createHash } = await import("crypto");
  const value = `zsh_${randomBytes(24).toString("hex")}`;
  const hash = createHash("sha256").update(value).digest("hex");
  const { error } = await supabase.from("api_keys").insert({
    organization_id: orgId, nombre: nombre.trim(), hash, prefijo: value.slice(0, 8), created_by: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, key: value });
}
