"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

const ROLES = ["owner", "admin", "manager", "employee", "viewer", "client"] as const;

export default function MemberActions({ orgId, userId, role, status, isSelf }: {
  orgId: string; userId: string; role: string; status: string; isSelf: boolean;
}) {
  const [msg, setMsg] = useState("");
  if (isSelf) return <small className="text-[#64748b]">tú</small>;
  const update = async (patch: { tenant_role?: string; status?: string }) => {
    const supabase = createClient();
    const { error } = await supabase.from("organization_members")
      .update(patch).eq("org_id", orgId).eq("user_id", userId);
    setMsg(error ? "Error: " + error.message : "Actualizado. Recarga.");
  };
  return (
    <span className="flex flex-wrap gap-1">
      <select
        className="rounded-lg border border-[#e6ebf2] px-2 py-1 text-xs"
        value={role}
        onChange={(e) => update({ tenant_role: e.target.value })}
      >
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {status === "active" ? (
        <Button variant="outline" onClick={async () => {
          if (!confirm("¿Suspender este usuario?")) return;
          await update({ status: "suspended" });
        }}>Suspender</Button>
      ) : (
        <Button variant="secondary" onClick={async () => {
          await update({ status: "active" });
        }}>Reactivar</Button>
      )}
      {msg && <small> {msg}</small>}
    </span>
  );
}
