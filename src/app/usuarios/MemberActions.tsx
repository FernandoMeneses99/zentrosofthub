"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

const ROLES = ["owner", "admin", "manager", "employee", "viewer"] as const;

export default function MemberActions({ orgId, userId, role, status, isSelf }: {
  orgId: string; userId: string; role: string; status: string; isSelf: boolean;
}) {
  const [msg, setMsg] = useState("");
  const supabase = createClient();
  if (isSelf) return <small className="text-[#64748b]">tú</small>;
  return (
    <span className="flex flex-wrap gap-1">
      <select
        className="rounded-lg border border-[#e6ebf2] px-2 py-1 text-xs"
        value={role}
        onChange={async (e) => {
          const { error } = await supabase.from("organization_members")
            .update({ tenant_role: e.target.value }).eq("org_id", orgId).eq("user_id", userId);
          setMsg(error ? "Error: " + error.message : "Rol actualizado. Recarga.");
        }}
      >
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {status === "active" ? (
        <Button variant="outline" onClick={async () => {
          if (!confirm("¿Suspender este usuario?")) return;
          const { error } = await supabase.from("organization_members")
            .update({ status: "suspended" }).eq("org_id", orgId).eq("user_id", userId);
          setMsg(error ? "Error: " + error.message : "Suspendido. Recarga.");
        }}>Suspender</Button>
      ) : (
        <Button variant="secondary" onClick={async () => {
          const { error } = await supabase.from("organization_members")
            .update({ status: "active" }).eq("org_id", orgId).eq("user_id", userId);
          setMsg(error ? "Error: " + error.message : "Reactivado. Recarga.");
        }}>Reactivar</Button>
      )}
      {msg && <small> {msg}</small>}
    </span>
  );
}
