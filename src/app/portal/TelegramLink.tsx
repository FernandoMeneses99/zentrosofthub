"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

// El cliente registra su chat de Telegram para recibir avances.
// Solo puede actualizar su propio telegram_chat_id (trigger guard_contact_self).
export default function TelegramLink({ initial }: { initial: string }) {
  const [chat, setChat] = useState(initial);
  const [msg, setMsg] = useState("");
  return (
    <Card>
      <CardTitle><Send size={14} className="mr-1 inline" />Avisos por Telegram</CardTitle>
      <p className="mt-1 text-xs text-[#64748b]">
        Habla con nuestro bot, luego pega aquí tu chat ID
        (pídelo escribiendo <code>/id</code> al bot o míralo en getUpdates).
      </p>
      <div className="mt-2 flex gap-2">
        <input aria-label="Tu chat ID de Telegram"
          className="flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
          placeholder="-100123…" value={chat} onChange={(e) => setChat(e.target.value)} />
        <Button
          onClick={async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from("contacts").update({ telegram_chat_id: chat.trim() || null }).eq("user_id", user?.id ?? "");
            setMsg(error ? "Error: " + error.message : "Guardado. Recibirás avances aquí.");
          }}
        >Guardar</Button>
      </div>
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </Card>
  );
}
