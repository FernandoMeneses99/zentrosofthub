// Telegram Bot API — avisos operativos (sin dependencias).
// Requiere TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en servidor.
export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { ok: false, error: "Telegram no configurado (BOT_TOKEN/CHAT_ID)" };
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
