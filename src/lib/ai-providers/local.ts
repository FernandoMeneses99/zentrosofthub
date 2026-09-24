// Proveedor IA local (sin dependencias externas ni API keys).
// Implementa la interfaz del gateway para tareas simples y deterministas.
// Cuando se conecte OpenAI/Anthropic/Gemini, se agrega otro adapter sin tocar la app.
export type Priority = "baja" | "media" | "alta" | "urgente";

const URGENT = ["caído", "caido", "urgente", "crítico", "critico", "emergencia", "no funciona", "down", "hack"];
const HIGH = ["error", "falla", "bug", "no puedo", "bloqueado", "facturación", "facturacion", "pago"];
const LOW = ["pregunta", "duda", "sugerencia", "cuando puedan", "mejora", "idea"];

export function suggestPriority(titulo: string, descripcion?: string | null): { prioridad: Priority; razones: string[] } {
  const text = `${titulo} ${descripcion ?? ""}`.toLowerCase();
  const hit = (words: string[]) => words.filter((w) => text.includes(w));
  const u = hit(URGENT);
  if (u.length > 0) return { prioridad: "urgente", razones: u };
  const h = hit(HIGH);
  if (h.length > 0) return { prioridad: "alta", razones: h };
  const l = hit(LOW);
  if (l.length > 0) return { prioridad: "baja", razones: l };
  return { prioridad: "media", razones: [] };
}
