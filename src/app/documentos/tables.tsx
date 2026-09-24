"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type Doc = { id: string; nombre: string; categoria: string; mime: string | null; size_bytes: number | null; storage_path: string; created_at: string };

function DownloadButton({ path }: { path: string }) {
  const [msg, setMsg] = useState("");
  return (
    <span>
      <Button
        variant="outline"
        onClick={async () => {
          const r = await fetch(`/api/documentos/url?path=${encodeURIComponent(path)}`);
          const j = await r.json();
          if (!r.ok) { setMsg("Error: " + j.error); return; }
          window.open(j.url, "_blank");
        }}
      >Descargar</Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}

const cols: ColumnDef<Doc>[] = [
  { accessorKey: "nombre", header: "Nombre" },
  { accessorKey: "categoria", header: "Categoría", cell: ({ row }) => <Badge tone="info">{row.original.categoria}</Badge> },
  { accessorKey: "size_bytes", header: "Tamaño", cell: ({ row }) => row.original.size_bytes ? `${(row.original.size_bytes / 1024).toFixed(1)} KB` : "—" },
  { id: "acciones", header: "Acciones", cell: ({ row }) => <DownloadButton path={row.original.storage_path} /> },
];

export function DocumentsTable({ rows }: { rows: Doc[] }) {
  return <DataTable columns={cols} data={rows} />;
}
