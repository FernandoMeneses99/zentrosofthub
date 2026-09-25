"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Paperclip } from "lucide-react";

export type Doc = { id: string; nombre: string; mime: string | null; storage_path: string };

function Preview({ doc }: { doc: Doc }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const isImg = (doc.mime ?? "").startsWith("image/");
  return (
    <li className="text-sm">
      <span className="font-medium">{doc.nombre}</span>{" "}
      <Button
        variant="ghost"
        onClick={async () => {
          if (open) { setOpen(false); return; }
          const r = await fetch(`/api/documentos/url?path=${encodeURIComponent(doc.storage_path)}`);
          const j = await r.json();
          if (r.ok) { setUrl(j.url); setOpen(true); }
        }}
      >{open ? "Ocultar" : "Vista previa"}</Button>
      {open && url && (isImg
        ? <img src={url} alt={doc.nombre} className="mt-2 max-h-64 rounded-lg border border-[#e6ebf2]" />
        : <a href={url} target="_blank" rel="noreferrer" className="ml-2 underline">Abrir archivo</a>)}
    </li>
  );
}

export default function Attachments({ docs }: { docs: Doc[] }) {
  if (docs.length === 0) return null;
  return (
    <Card>
      <CardTitle><Paperclip size={14} className="mr-1 inline" />Adjuntos ({docs.length})</CardTitle>
      <ul className="mt-2 space-y-2">
        {docs.map((d) => <Preview key={d.id} doc={d} />)}
      </ul>
    </Card>
  );
}
