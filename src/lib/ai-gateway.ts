// AI Service Gateway — desacoplado del proveedor (stub, sin llamadas externas todavía).
// Toda solicitud futura debe incluir organization_id + user_id y pasar has_permission en DB.
// El gateway solo envía los campos mínimos necesarios (redacción PII) y registra en ai_requests.
export type AiTask = "classification" | "summarization" | "extraction" | "recommendation" | "search" | "generation";

export interface AiRequest {
  organizationId: string;
  userId: string;
  task: AiTask;
  inputRef: string; // referencia al recurso (ej. ticket:uuid), nunca el texto con PII
}

export async function requestAi(_req: AiRequest): Promise<{ status: "not_configured" }> {
  // Sin proveedor configurado: registrar intento queda para Fase IA.
  return { status: "not_configured" };
}
