import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { suggestPriority } from "@/lib/ai-providers/local";

export const dynamic = "force-dynamic";

// Rate-limit simple en memoria: 10 req/min por usuario (instancia).
const hits = new Map<string, number[]>();
function limited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > 10;
}

// POST /api/ai/suggest { ticket_id } → sugiere prioridad con proveedor local.
// Verifica sesión + pertenencia al tenant antes de exponer cualquier dato.
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (limited(user.id)) return NextResponse.json({ error: "Límite excedido: 10/min" }, { status: 429 });

  const { ticket_id } = (await request.json()) as { ticket_id?: string };
  if (!ticket_id) return NextResponse.json({ error: "ticket_id requerido" }, { status: 400 });

  const { data: ticket, error } = await supabase.from("tickets")
    .select("id,titulo,descripcion,organization_id").eq("id", ticket_id).single();
  if (error || !ticket) return NextResponse.json({ error: "Ticket no encontrado o sin acceso" }, { status: 404 });

  const { prioridad, razones } = suggestPriority(ticket.titulo, ticket.descripcion);
  await supabase.from("ai_requests").insert({
    organization_id: ticket.organization_id, user_id: user.id,
    tarea: "classification", modelo: "local-keywords-v1", estado: "ok",
  });
  return NextResponse.json({ prioridad, razones, modelo: "local-keywords-v1" });
}
