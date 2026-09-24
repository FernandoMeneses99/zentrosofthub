"use client";

export default function HubError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg space-y-4 p-8 text-center">
      <h1 className="text-xl font-extrabold text-[#0a1628]">Algo falló al cargar esta vista</h1>
      <p className="text-sm text-[#64748b]">{error.message || "Error inesperado."}</p>
      {error.digest && <p className="text-xs text-[#64748b]">Ref: {error.digest}</p>}
      <button
        onClick={reset}
        className="rounded-[10px] bg-[#4b82c3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a6aa3]"
      >
        Reintentar
      </button>
    </main>
  );
}
