import { CircleCheck } from "lucide-react";
import { Badge } from "./card";

export const SERVICE_STAGES = [
  { key: "abierto", label: "Recibido" },
  { key: "pendiente", label: "En diagnóstico" },
  { key: "en_proceso", label: "En reparación" },
  { key: "resuelto", label: "Resuelto" },
  { key: "cerrado", label: "Entregado" },
] as const;

export function stageOf(estado: string): number {
  const i = SERVICE_STAGES.findIndex((s) => s.key === estado);
  return i < 0 ? 0 : i;
}

// Stepper compacto para un ticket individual.
export function TicketStage({ estado }: { estado: string }) {
  const idx = stageOf(estado);
  return (
    <div>
      <ol className="flex items-center gap-1" aria-label={`Etapa: ${SERVICE_STAGES[idx].label}`}>
        {SERVICE_STAGES.map((s, i) => (
          <li key={s.key} className="flex flex-1 flex-col items-center gap-1" aria-current={i === idx ? "step" : undefined}>
            <span className={`grid size-7 place-content-center rounded-full text-xs font-bold ${i < idx ? "bg-[#4fd290] text-[#0a1628]" : i === idx ? "bg-[#4b82c3] text-white" : "bg-[#e6ebf2] text-[#64748b]"}`}>
              {i < idx ? <CircleCheck size={14} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`text-[11px] ${i === idx ? "font-semibold text-[#0a1628]" : "text-[#64748b]"}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]" role="progressbar"
        aria-valuenow={((idx + 1) / SERVICE_STAGES.length) * 100} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#4b82c3] to-[#4fd290]"
          style={{ width: `${((idx + 1) / SERVICE_STAGES.length) * 100}%` }} />
      </div>
    </div>
  );
}

// Resumen agregado para listas (empresa u organización).
export function StageBadges({ tickets }: { tickets: { estado: string }[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {SERVICE_STAGES.map((s) => {
        const n = tickets.filter((t) => t.estado === s.key).length;
        if (n === 0) return null;
        return <Badge key={s.key} tone={s.key === "cerrado" ? "ok" : "info"}>{s.label}: {n}</Badge>;
      })}
    </span>
  );
}
