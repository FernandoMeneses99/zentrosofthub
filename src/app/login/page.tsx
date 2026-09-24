"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const supabase = createClient();
  return (
    <main style={{ padding: 32, maxWidth: 420 }}>
      <h1>Ingresar al Hub</h1>
      <p>Te enviaremos un enlace mágico a tu correo.</p>
      <input
        type="email" placeholder="tu@zentrosoft.dev" value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      />
      <button
        onClick={async () => {
          const { error } = await supabase.auth.signInWithOtp({
            email, options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/dashboard" },
          });
          setMsg(error ? "Error: " + error.message : "Revisa tu correo.");
        }}
        style={{ padding: "10px 20px" }}
      >Enviar enlace</button>
      <p>{msg}</p>
    </main>
  );
}
