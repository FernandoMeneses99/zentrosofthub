import * as React from "react";

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-[#0a1628] p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-r from-[#4b82c3] via-[#4fd290] to-transparent" />
    </div>
  );
}
