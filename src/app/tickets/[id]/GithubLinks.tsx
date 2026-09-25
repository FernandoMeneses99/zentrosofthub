"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export type Link = { id: string; tipo: string; url: string; ref: string | null };

export default function GithubLinks({ ticketId, orgId, initial }: {
  ticketId: string; orgId: string; initial: Link[];
}) {
  const [links, setLinks] = useState(initial);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <Card>
      <CardTitle><GitBranch size={14} className="mr-1 inline" />Código vinculado</CardTitle>
      <ul className="mt-2 space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer">{l.ref || l.url}</a>
            <span className="text-xs text-[#64748b]"> ({l.tipo})</span>
          </li>
        ))}
        {links.length === 0 && <li className="text-[#64748b]">Sin enlaces. Pega el commit o PR del repo del cliente.</li>}
      </ul>
      <div className="mt-3 flex gap-2">
        <input aria-label="URL del commit o PR" placeholder="https://github.com/cliente/repo/commit/…" 
          className="flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
          value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button
          onClick={async () => {
            if (!url.includes("github.com/")) { setMsg("Error: pega una URL de GitHub."); return; }
            const tipo = url.includes("/pull/") ? "pr" : url.includes("/commit/") ? "commit" : "otro";
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase.from("ticket_links").insert({
              organization_id: orgId, ticket_id: ticketId, tipo, url,
              ref: url.split("/").slice(-1)[0].slice(0, 40), created_by: user?.id,
            }).select("id,tipo,url,ref").single();
            if (error) setMsg("Error: " + error.message);
            else { setLinks([...links, data]); setUrl(""); setMsg(""); }
          }}
        >Vincular</Button>
      </div>
      {msg && <p className="mt-1 text-xs text-red-700">{msg}</p>}
    </Card>
  );
}
