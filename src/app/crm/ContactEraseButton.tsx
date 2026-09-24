"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

export default function ContactEraseButton({ orgId, contactId, nombre }: {
  orgId: string; contactId: string; nombre: string;
}) {
  const [msg, setMsg] = useState("");
  return (
    <span>
      <Button
        variant="danger"
        onClick={async () => {
          if (!confirm(`Anonimizar a ${nombre} según Ley 1581? Esta acción es irreversible.`)) return;
          const supabase = createClient();
          const { error } = await supabase.rpc("erase_contact", { p_org: orgId, p_contact: contactId });
          setMsg(error ? "Error: " + error.message : "Anonimizado. Recarga.");
        }}
      >Anonimizar</Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
