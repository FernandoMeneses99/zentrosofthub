# Runbook — Zentrosoft Hub (MVP interno)

## Deploys
- Dev local: `npm run dev` → http://localhost:3000
- Prod: `npm run build` verificado OK (Next 15, 11 rutas).

## Migraciones aplicadas (us-east-1)
001_core · 002_crm_time_audit · 003_grants · 004_audit_triggers · 005_member_rls · 006_missing_rls · 007_time_approve + bootstrap_owner.

## Prueba de aislamiento (pendiente, 10 min)
1. Crear segundo usuario (otro email) vía /login.
2. Crear segunda org + membership employee (SQL Editor).
3. Verificar: no ve empresas/horas de `zentrosoft`; aprobar hora ajena falla con `Requiere permiso time.approve`.

## Respuesta a incidentes
- Fuga sospechada: revocar sesión (Dashboard → Auth), revisar `audit_logs` + `security_events`.
- Rotar keys: Supabase → Settings → API → Rotate; actualizar `.env.local` / Vercel env.

## Pendiente abogado (Ley 1581)
Textos de política/aviso, registro SIC si aplica, procedimiento PQRS y plazos.
