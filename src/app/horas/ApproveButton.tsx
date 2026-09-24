"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function ApproveButton({ id, estado }: { id: string; estado: string }) {
  const [msg, setMsg] = useState("");
  if (estado === "aprobado") return <small> ✓ aprobada</small>;
  return (
    <span>
      {" "}
      <button
        onClick={async () => {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const { error } = await supabase.from("time_entries").update({
            estado: "aprobado", approved_by: user?.id, approved_at: new Date().toISOString(),
          }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Aprobada. Recarga.");
        }}
      >Aprobar</button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
