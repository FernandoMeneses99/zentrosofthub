# Deploy — Zentrosoft Hub en Vercel

## Decisión de versión
Next `15.5.26` es el último parche de la línea 15 (latest global: 16.x).
Se queda en 15 hasta estabilizar el MVP; migrar a 16 como tarea separada.

## Pasos
1. Nuevo proyecto Vercel desde `ZentroSoftHub/` (root directory del repo o repo separado).
2. Variables de entorno (Production):
   - `NEXT_PUBLIC_SUPABASE_URL` (misma de `.env.local`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (misma de `.env.local`)
   - NO subir `SUPABASE_SERVICE_ROLE_KEY` al frontend.
3. Supabase → Authentication → URL Configuration:
   - Site URL: `https://<tu-dominio>.vercel.app`
   - Redirect URLs: agregar `https://<tu-dominio>.vercel.app/auth/callback`
4. Deploy y probar: `/login` → `/dashboard` → `/crm`.

## Checklist pre-prod
- [ ] Proyecto Supabase `dev` separado para pruebas (no usar prod como dev).
- [ ] PITR activado en prod (Database → Backups).
- [ ] Prueba de aislamiento con 2 tenants ejecutada (`supabase/isolation_test.sql`).
- [ ] Textos Ley 1581 validados con abogado.
- [ ] `.next/` excluido de OneDrive (evita caché corrupta en dev).
