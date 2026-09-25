"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/card";
import Link from "next/link";

export type Project = { id: string; nombre: string; estado: string; company_id: string | null };
export type Task = { id: string; titulo: string; estado: string; project_id: string | null };

const projectCols: ColumnDef<Project>[] = [
  { accessorKey: "nombre", header: "Proyecto", cell: ({ row }) => <Link href={`/proyectos/${row.original.id}`}>{row.original.nombre}</Link> },
  { accessorKey: "estado", header: "Estado", cell: ({ row }) => <Badge tone={row.original.estado === "activo" ? "ok" : "default"}>{row.original.estado}</Badge> },
];

const taskCols: ColumnDef<Task>[] = [
  { accessorKey: "titulo", header: "Tarea" },
  { accessorKey: "estado", header: "Estado", cell: ({ row }) => <Badge tone="info">{row.original.estado}</Badge> },
];

export function ProjectsTable({ rows }: { rows: Project[] }) {
  return <DataTable columns={projectCols} data={rows} />;
}

export function TasksTable({ rows }: { rows: Task[] }) {
  return <DataTable columns={taskCols} data={rows} />;
}
