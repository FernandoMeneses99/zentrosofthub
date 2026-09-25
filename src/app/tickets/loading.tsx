export default function Loading() {
  return (
    <main className="space-y-4 p-8" aria-busy="true" aria-label="Cargando">
      <div className="h-28 animate-pulse rounded-[20px] bg-[#e6ebf2]" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-[18px] bg-white shadow-sm" />)}
      </div>
      <div className="h-64 animate-pulse rounded-[18px] bg-white" />
    </main>
  );
}
