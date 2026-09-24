"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

// Crea la solicitud de firma en estado borrador.
// Cuando se conecte Documenso, este mismo registro recibe el external_id
// y el webhook /api/firma/webhook mueve el estado a firmado.
export default function SendToSign({ orgId, documentId }: { orgId: string; documentId: string }) {
  const [msg, setMsg] = useState("");
  return (
    <span>
      <Button
        variant="secondary"
        onClick={async () => {
          const email = prompt("Email del firmante:");
          if (!email) return;
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const { error } = await supabase.from("signing_requests").insert({
            organization_id: orgId, document_id: documentId,
            provider: "documenso", estado: "borrador",
            firmantes: [{ email }], created_by: user?.id,
          });
          setMsg(error ? "Error: " + error.message : "Enviado a firma (borrador). Recarga.");
        }}
      ><PenLine size={15} /> Enviar a firma</Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
