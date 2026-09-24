"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CATS = ["general", "contrato", "factura", "evidencia", "otro"] as const;
const MAX_MB = 10;

export default function UploadForm({ orgId }: { orgId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [cat, setCat] = useState<(typeof CATS)[number]>("general");
  const [msg, setMsg] = useState("");
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Subir documento (máx {MAX_MB} MB)</h3>
      <div className="flex flex-wrap items-center gap-2">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <select className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
          value={cat} onChange={(e) => setCat(e.target.value as never)}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button
          onClick={async () => {
            if (!file) { setMsg("Elige un archivo."); return; }
            if (file.size > MAX_MB * 1024 * 1024) { setMsg(`Máximo ${MAX_MB} MB.`); return; }
            const supabase = createClient();
            const path = `org/${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
            const { error: upErr } = await supabase.storage.from("documentos").upload(path, file);
            if (upErr) { setMsg("Error: " + upErr.message); return; }
            const { error: dbErr } = await supabase.from("documents").insert({
              organization_id: orgId, nombre: file.name, storage_path: path,
              mime: file.type || null, size_bytes: file.size, categoria: cat,
            });
            setMsg(dbErr ? "Error: " + dbErr.message : "Subido. Recarga.");
          }}
        >Subir</Button>
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
