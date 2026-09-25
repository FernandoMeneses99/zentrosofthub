// Rate-limit en memoria por instancia (suficiente para 1 instancia;
// migrar a Redis/Upstash con multi-instancia).
const hits = new Map<string, number[]>();

export function rateLimited(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}
