// Telegram Bot API — avisos operativos (sin dependencias).
// Config por organización (tabla integraciones) con fallback a env.
import type { SupabaseClient } from "@supabase/supabase-js";

async function post(token: string, chat: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { ok: false, error: `Telegram ${r.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Red" };
  }
}

export async function sendTelegramOrg(
  supabase: SupabaseClient, orgId: string, text: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data } = await supabase.from("integraciones")
    .select("config,activo").eq("organization_id", orgId).eq("provider", "telegram").single();
  const cfg = (data?.activo ? data.config : null) as { bot_token?: string; chat_id?: string } | null;
  const token = cfg?.bot_token || process.env.TELEGRAM_BOT_TOKEN;
  const chat = cfg?.chat_id || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { ok: false, error: "Telegram no configurado (Ajustes → Telegram)" };
  return post(token, chat, text);
}

export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { ok: false, error: "Telegram no configurado" };
  return post(token, chat, text);
}
