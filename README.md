# Zentrosoft Client Hub — proyecto nuevo (Fase 2 en curso)

Stack: Next.js (App Router) + TypeScript + Supabase (Postgres + Auth + RLS + Storage).
Repo landing `ZentroSoft/` intacto; este es sistema aparte.

## Qué se va a crear
- `apps/hub` lógico en raíz: `src/app`, `src/lib`, `src/components`
- `supabase/migrations/001_core.sql`: organizations, profiles, memberships, roles, permissions
- `supabase/migrations/002_crm_time_audit.sql`: companies, contacts, projects, tasks, time_entries, audit_logs, security_events, ai_requests
- RLS: shared schema + organization_id, FORCE RLS, funciones my_orgs()/has_permission()
- Sin ejecución contra Supabase real todavía (requiere credenciales/proyecto nuevo).

## Riesgos
- Ningún cambio destructivo: carpeta estaba vacía.
- No se conecta a producción: solo archivos SQL locales.

## Siguiente autorización necesitada
- Nombre proyecto Supabase, región, stack Hub (Next.js recomendado), proveedor email/IA.
