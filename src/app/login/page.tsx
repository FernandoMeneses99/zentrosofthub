"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";

type Tab = "password" | "magic";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!/.+@.+\..+/.test(email)) { setMsg("Error: email inválido."); return; }
    setLoading(true);
    const supabase = createClient();
    try {
      if (tab === "password") {
        if (password.length < 6) { setMsg("Error: mínimo 6 caracteres."); setLoading(false); return; }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg("Error: " + error.message);
        else router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email, options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/dashboard" },
        });
        setMsg(error ? "Error: " + error.message : "Revisa tu correo (puede tardar unos minutos).");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a1628] p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[24px] bg-white shadow-2xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#0a1628] via-[#132238] to-[#3a6aa3] p-10 text-white lg:flex">
          <span className="grid size-12 place-content-center rounded-2xl bg-gradient-to-br from-[#4b82c3] to-[#4fd290] text-xl font-extrabold text-[#0a1628]">Z</span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Zentrosoft Hub</h1>
            <p className="mt-2 text-sm text-slate-300">
              Centro operativo: CRM, horas, tickets, proyectos y auditoría con aislamiento multi-tenant.
            </p>
          </div>
          <p className="text-xs text-slate-400">Acceso interno · tus datos están protegidos por RLS</p>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-xl font-extrabold text-[#0a1628]">Ingresar</h2>
          <p className="mb-4 text-sm text-[#64748b]">Usa tu contraseña o un enlace mágico.</p>

          <div role="tablist" aria-label="Método de ingreso" className="mb-5 grid grid-cols-2 gap-1 rounded-[10px] bg-[#f1f5f9] p-1">
            {([["password", "Contraseña", KeyRound], ["magic", "Enlace mágico", Mail]] as const).map(([v, label, Icon]) => (
              <button
                key={v} role="tab" aria-selected={tab === v}
                onClick={() => { setTab(v); setMsg(""); }}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${tab === v ? "bg-white text-[#0a1628] shadow" : "text-[#64748b] hover:text-[#0a1628]"}`}
              >
                <Icon size={15} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          {msg && <p role="alert" className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-[#0a1628]">Email</label>
              <input
                id="login-email" type="email" autoComplete="email" required
                className="w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                placeholder="tu@zentrosoft.dev" value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {tab === "password" && (
              <div>
                <label htmlFor="login-pass" className="mb-1 block text-sm font-medium text-[#0a1628]">Contraseña</label>
                <div className="relative">
                  <input
                    id="login-pass" type={show ? "text" : "password"} autoComplete="current-password" required
                    className="w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2 pr-10"
                    placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#64748b] hover:text-[#0a1628]"
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verificando…" : tab === "password" ? "Entrar" : "Enviar enlace"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-[#64748b]">
            ¿Eres técnico nuevo? Pide al owner que cree tu cuenta con contraseña.
          </p>
        </div>
      </div>
    </main>
  );
}
