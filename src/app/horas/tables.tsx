"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/card";
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
  const cols: ColumnDef<Entry>[] = write ? [
    ...baseCols,
    { id: "acciones", header: "Acciones", cell: ({ row }) => (
      <span className="flex gap-2">
        {approve && <ApproveButton id={row.original.id} estado={row.original.estado} />}
        <TimeEntryActions id={row.original.id} descripcion={row.original.descripcion} />
      </span>
    ) },
  ] : baseCols;
  return <DataTable columns={cols} data={rows} />;
}
