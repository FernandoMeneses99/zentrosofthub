"use client";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { EllipsisVertical, MessageSquareReply, Trash2 } from "lucide-react";

export type Comment = {
  id: string; cuerpo: string; es_interna: boolean; created_at: string;
  autor: string | null; autor_nombre: string | null;
};

const schema = z.object({
  cuerpo: z.string().trim().min(1, "Escribe un mensaje").max(5000),
  es_interna: z.boolean(),
});

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-6 shrink-0 place-content-center rounded-full bg-gradient-to-br from-[#4b82c3] to-[#4fd290] text-[11px] font-bold text-white" aria-hidden="true">
      {(name || "U").charAt(0).toUpperCase()}
    </span>
  );
}

export default function Discussion({ ticketId, orgId, userId, initial, canWrite }: {
  ticketId: string; orgId: string; userId: string;
  initial: Comment[]; canWrite: boolean;
}) {
  const [comments, setComments] = useState(initial);
  const [msg, setMsg] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { cuerpo: "", es_interna: false as boolean },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("ticket_comments").insert({
        organization_id: orgId, ticket_id: ticketId, autor: user?.id,
        cuerpo: value.cuerpo, es_interna: value.es_interna,
      }).select("id,cuerpo,es_interna,created_at,autor,autor_nombre").single();
      if (error) { setMsg("Error: " + error.message); return; }
      setComments((cs) => [...cs, data]);
      setReplyTo(null);
      setMsg("");
      form.reset();
    },
  });

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("ticket_comments").delete().eq("id", id);
    if (error) setMsg("Error: " + error.message);
    else setComments((cs) => cs.filter((c) => c.id !== id));
    setOpenMenu(null);
  };

  return (
    <section aria-label="Observaciones del caso">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0a1628]">Observaciones ({comments.length})</h2>
      </div>

      {canWrite && (
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="mb-6">
          <div className="mb-3 rounded-lg rounded-t-lg border border-[#e6ebf2] bg-white px-4 py-2">
            <label htmlFor="comment-body" className="sr-only">Tu observación</label>
            <form.Field name="cuerpo">
              {(field) => (
                <textarea
                  id="comment-body" rows={4} required
                  className="w-full border-0 px-0 text-sm text-[#0a1628] focus:outline-none focus:ring-0"
                  placeholder={replyTo ? `Respondiendo a ${replyTo}…` : "Escribe una observación…"}
                  value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          </div>
          <div className="flex items-center justify-between">
            <form.Field name="es_interna">
              {(field) => (
                <label className="flex items-center gap-2 text-xs text-[#64748b]">
                  <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} />
                  Nota interna (no visible al cliente)
                </label>
              )}
            </form.Field>
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Publicando…" : "Publicar"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      )}
      {msg && <p className="mb-3 text-sm text-red-700">{msg}</p>}

      {comments.map((c) => {
        const nombre = c.autor_nombre || "Usuario";
        return (
        <article key={c.id} className={`mb-3 rounded-[18px] border bg-white p-5 text-sm ${c.es_interna ? "border-amber-200 bg-amber-50/50" : "border-[#e6ebf2]"}`}>
          <footer className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={nombre} />
              <p className="font-semibold text-[#0a1628]">{nombre}</p>
              <p className="text-xs text-[#64748b]">
                <time dateTime={c.created_at}>{c.created_at.slice(0, 16).replace("T", " ")}</time>
              </p>
              {c.es_interna && <Badge tone="warn">interna</Badge>}
            </div>
            {canWrite && (
              <div className="relative">
                <button
                  type="button" aria-label="Opciones del mensaje" aria-expanded={openMenu === c.id}
                  onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                  className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  <EllipsisVertical size={16} aria-hidden="true" />
                </button>
                {openMenu === c.id && (
                  <ul className="absolute right-0 z-10 w-36 divide-y divide-[#eef2f7] rounded-lg border border-[#e6ebf2] bg-white py-1 text-sm shadow-lg">
                    <li>
                      <button
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-[#f8fafc]"
                        onClick={() => {
                          form.setFieldValue("cuerpo", `@${nombre} `);
                          setReplyTo(nombre);
                          setOpenMenu(null);
                          document.getElementById("comment-body")?.focus();
                        }}
                      >
                        <MessageSquareReply size={14} aria-hidden="true" /> Responder
                      </button>
                    </li>
                    {c.autor === userId && (
                      <li>
                        <button
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                          onClick={() => remove(c.id)}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Eliminar
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </footer>
          <p className="whitespace-pre-wrap text-[#334155]">{c.cuerpo}</p>
        </article>
        );
      })}
      {comments.length === 0 && <p className="text-sm text-[#64748b]">Sin observaciones todavía. Sé el primero en escribir.</p>}
    </section>
  );
}
