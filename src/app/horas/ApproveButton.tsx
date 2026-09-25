"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

// Solo se renderiza si canApprove (owner/admin/manager). La DB (007) lo re-verifica.
export default function ApproveButton({ id, estado }: { id: string; estado: string }) {
  const [msg, setMsg] = useState("");
  if (estado === "aprobado") return <small className="text-green-700">Aprobada</small>;
  const set = async (nuevo: "aprobado" | "rechazado") => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("time_entries").update({
      estado: nuevo, approved_by: user?.id, approved_at: new Date().toISOString(),
    }).eq("id", id);
    setMsg(error ? "Error: " + error.message : `${nuevo === "aprobado" ? "Aprobada" : "Rechazada"}. Recarga.`);
  };
  return (
    <span className="flex gap-1">
      <Button variant="secondary" onClick={() => set("aprobado")} aria-label="Aprobar hora">
        <Check size={14} />
      </Button>
      <Button variant="outline" onClick={() => set("rechazado")} aria-label="Rechazar hora">
        <X size={14} />
      </Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
