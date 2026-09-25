"use client";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApproveButton from "./ApproveButton";
import TimeEntryActions from "./TimeEntryActions";

type Entry = { id: string; fecha: string; descripcion: string | null; duration_min: number | null; billable: boolean; estado: string };

const baseCols: ColumnDef<Entry>[] = [
  { accessorKey: "fecha", header: "Fecha" },
  { accessorKey: "descripcion", header: "Descripción", cell: ({ row }) => row.original.descripcion ?? "—" },
  { accessorKey: "duration_min", header: "Min", cell: ({ row }) => row.original.duration_min ?? 0 },
  { accessorKey: "billable", header: "Tipo", cell: ({ row }) => (
    <Badge tone={row.original.billable ? "ok" : "default"}>{row.original.billable ? "facturable" : "interna"}</Badge>
  ) },
  { accessorKey: "estado", header: "Estado", cell: ({ row }) => (
    <Badge tone={row.original.estado === "aprobado" ? "ok" : row.original.estado === "rechazado" ? "warn" : "info"}>{row.original.estado}</Badge>
  ) },
];

export function HoursTable({ rows, write, approve }: { rows: Entry[]; write: boolean; approve: boolean }) {
  const [sel, setSel] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const cols: ColumnDef<Entry>[] = [
    ...baseCols,
    ...(write ? [{
      id: "acciones", header: "Acciones", cell: ({ row }: { row: { original: Entry } }) => (
        <span className="flex gap-2">
          {approve && <ApproveButton id={row.original.id} estado={row.original.estado} />}
          <TimeEntryActions id={row.original.id} descripcion={row.original.descripcion} />
        </span>
      ),
    } as ColumnDef<Entry>] : []),
    ...(approve ? [{
      id: "sel", header: "✓", cell: ({ row }: { row: { original: Entry } }) => (
        <input type="checkbox" aria-label={`Seleccionar hora ${row.original.fecha}`}
          checked={sel.includes(row.original.id)}
          onChange={() => setSel((s) => (s.includes(row.original.id) ? s.filter((x) => x !== row.original.id) : [...s, row.original.id]))} />
      ),
    } as ColumnDef<Entry>] : []),
  ];
  const masivo = async (estado: "aprobado" | "rechazado") => {
    const r = await fetch("/api/horas/masivo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: sel, estado }),
    });
    const j = await r.json();
    setMsg(r.ok ? `Listo: ${j.ok} ok${j.errores.length ? `, ${j.errores.length} fallaron (${j.errores[0].error})` : ""}. Recarga.` : "Error: " + j.error);
    if (r.ok && j.errores.length === 0) setSel([]);
  };
  return (
    <div className="space-y-3">
      {approve && sel.length > 0 && (
        <div className="flex items-center gap-2 rounded-[18px] border border-[#4b82c3]/30 bg-[#4b82c3]/5 p-3 text-sm">
          <strong>{sel.length} seleccionadas</strong>
          <Button onClick={() => masivo("aprobado")}>Aprobar</Button>
          <Button variant="outline" onClick={() => masivo("rechazado")}>Rechazar</Button>
          {msg && <span className="text-xs">{msg}</span>}
        </div>
      )}
      <DataTable columns={cols} data={rows} />
    </div>
  );
}
