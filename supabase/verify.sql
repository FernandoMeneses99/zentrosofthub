-- verify.sql — verificación de esquema (SOLO LECTURA, seguro en prod).
-- Ejecutar en SQL Editor. Todo debe devolver una fila; vacío = objeto faltante.
-- Tablas esperadas:
select 'tabla:' || tablename as check, true as ok from pg_tables
where schemaname = 'public' and tablename in (
 'organizations','profiles','organization_members','permissions','role_permissions',
 'companies','contacts','projects','tasks','time_entries','audit_logs','security_events',
 'ai_requests','tickets','ticket_comments','ticket_links','documents','signing_requests',
 'sla_policies','kb_articles','mantenimientos','integraciones');
-- Funciones esperadas:
select 'funcion:' || p.proname as check, true as ok from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in (
 'my_orgs','has_permission','is_client','my_company_ids','log_audit','chain_audit_hash',
 'guard_time_approval','guard_write_perm','guard_contact_self','guard_documents',
 'set_ticket_sla','set_comment_author','handle_new_user','similar_tickets',
 'vincular_mi_contacto','erase_contact');
-- RLS activado en tablas de negocio:
select 'rls:' || tablename as check, rowsecurity as ok from pg_tables
where schemaname = 'public' and tablename in (
 'organizations','companies','contacts','projects','tasks','time_entries',
 'tickets','ticket_comments','documents','audit_logs');
-- Permisos del rol client:
select 'perm-client:' || permission as check, true as ok from role_permissions
where tenant_role = 'client';
