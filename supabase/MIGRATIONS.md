# Migraciones — orden y control (DB-001)

Las migraciones se aplican **en orden numérico** en Supabase → SQL Editor.
`supabase/verify.sql` confirma qué objetos existen (ejecutarlo tras cada lote).

## Orden
001_core → 002_crm_time_audit → 003_grants → 004_audit_triggers →
005_member_rls → 006_missing_rls → 007_time_approve → 008_hardening →
009_fix_hash → 010_constraints → 011_tickets → 012_auto_profile →
013_audit_projects → 014_sla_base → 015_ticket_comments → 016_erase →
017_similar → 018_documents → 019_firma → 020_grants_fix → 021_write_guard →
022_readonly_tech → 023_tech_comment → 024_sla_policies → 025_kb →
026_client_portal → 027_client_role → 028_client_own → 029_client_refine →
030_autor_nombre → 031_github_links → 032_integraciones → 033_vinculo →
034_cliente_plus → 035_vinculo_fix → 036_vinculo_guard

## Reglas
- Nunca editar una migración ya aplicada: crear una nueva.
- Toda migración de escritura incluye `drop ... if exists` (re-ejecutable).
- Antes de prod: `verify.sql` sin filas faltantes.
- Pendiente: adoptar Supabase CLI (`supabase db push`) para tracking automático.
