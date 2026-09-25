"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { companySchema } from "@/lib/validators";

// Importa empresas desde CSV con cabecera:
// razon_social,nit,email,telefono,ciudad
export default function ImportCsv({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const parse = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { setMsg("Error: se necesita cabecera + al menos 1 fila."); return; }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["razon_social", "nit", "email", "telefono", "ciudad"];
    if (!required.every((r) => headers.includes(r))) {
      setMsg("Error: cabecera debe ser razon_social,nit,email,telefono,ciudad");
      return;
    }
    setRows(lines.slice(1, 101).map((l) => {
      const cells = l.split(",").map((c) => c.trim());
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
    }));
    setMsg(`${Math.min(lines.length - 1, 100)} filas listas para importar (máx 100).`);
  };

  const importar = async () => {
    setLoading(true);
    const supabase = createClient();
    let ok = 0;
    const errores: string[] = [];
    for (const [i, r] of rows.entries()) {
      const parsed = companySchema.safeParse({
        razon_social: r.razon_social ?? "", nit: r.nit ?? "", email: r.email ?? "",
        telefono: r.telefono ?? "", ciudad: r.ciudad ?? "",
        nombre_comercial: "", tipo: "", industria: "", direccion: "", pais: "",
        website: "", notas: "",
      });
      if (!parsed.success) { errores.push(`Fila ${i + 2}: ${parsed.error.issues[0].message}`); continue; }
      const nullify = (v: string) => (v === "" ? null : v);
      const { error } = await supabase.from("companies").insert({
        organization_id: orgId, razon_social: r.razon_social,
        nit: nullify(r.nit), email: nullify(r.email),
        telefono: nullify(r.telefono), ciudad: nullify(r.ciudad),
      });
      if (error) errores.push(`Fila ${i + 2}: ${error.message}`);
      else ok++;
    }
    setMsg(`Importadas ${ok}/${rows.length}.${errores.length ? " Errores: " + errores.slice(0, 3).join(" | ") : ""} Recarga.`);
    setLoading(false);
  };

  return (
    <Card>
      <CardTitle>Importar empresas (CSV)</CardTitle>
      <p className="mt-1 text-xs text-[#64748b]">Cabecera exacta: razon_social,nit,email,telefono,ciudad</p>
      <div className="mt-2 flex gap-2">
        <input type="file" accept=".csv,text/csv" aria-label="Archivo CSV"
          className="text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) f.text().then(parse).catch(() => setMsg("Error leyendo archivo."));
          }} />
        <Button disabled={rows.length === 0 || loading} onClick={importar}>
          {loading ? "Importando…" : `Importar ${rows.length}`}
        </Button>
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
