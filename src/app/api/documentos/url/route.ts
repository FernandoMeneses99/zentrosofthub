import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/documentos/url?path=org/<orgId>/file → signed URL 60s.
// Verifica sesión + que el documento pertenezca al tenant.
export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path || !path.startsWith("org/")) return NextResponse.json({ error: "path inválido" }, { status: 400 });

  const { data: doc } = await supabase.from("documents").select("id").eq("storage_path", path).single();
  if (!doc) return NextResponse.json({ error: "Sin acceso" }, { status: 404 });

  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(path, 60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
