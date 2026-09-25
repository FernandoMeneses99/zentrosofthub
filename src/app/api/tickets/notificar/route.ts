import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";

export const dynamic = "force-dynamic";

// POST /api/tickets/notificar { ticket_id } → avisa por Telegram a los
// contactos de la empresa con telegram_chat_id (cambio de etapa).
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId || !canWrite(memberships?.[0]?.tenant_role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  const { ticket_id } = (await request.json()) as { ticket_id?: string };
  if (!ticket_id) return NextResponse.json({ error: "ticket_id requerido" }, { status: 400 });

  const { data: ticket } = await supabase.from("tickets")
    .select("id,titulo,estado,company_id").eq("id", ticket_id).eq("organization_id", orgId).single();
  if (!ticket?.company_id) return NextResponse.json({ error: "Ticket sin empresa" }, { status: 404 });

  const { data: contactos } = await supabase.from("contacts")
    .select("telegram_chat_id").eq("company_id", ticket.company_id).not("telegram_chat_id", "is", null);
  const chats = [...new Set((contactos ?? []).map((c) => c.telegram_chat_id as string).filter(Boolean))];
  if (chats.length === 0) return NextResponse.json({ ok: true, enviados: 0, nota: "Sin chats registrados" });

  // Enviar con el token del org a cada chat:
  const { data: integ } = await supabase.from("integraciones").select("config,activo")
    .eq("organization_id", orgId).eq("provider", "telegram").single();
  const cfg = (integ?.activo ? integ.config : null) as { bot_token?: string; chat_id?: string } | null;
  const token = cfg?.bot_token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "Telegram no configurado" }, { status: 500 });

  const text = `<b>${ticket.titulo}</b>\nTu caso pasó a: <b>${ticket.estado.replace("_", " ")}</b>`;
  let enviados = 0;
  for (const chat of chats) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) enviados++;
    } catch { /* siguiente */ }
  }
  return NextResponse.json({ ok: true, enviados });
}
