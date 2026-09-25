export default function Loading() {
  return (
    <main className="space-y-4 p-8" aria-busy="true" aria-label="Cargando">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-[18px] bg-white shadow-sm" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-[18px] bg-white lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-[18px] bg-white" />
      </div>
    </main>
  );
}
