-- 013_audit_projects: auditoría automática projects/tasks (NO aplicado).
drop trigger if exists trg_projects_audit on projects;
create trigger trg_projects_audit after insert or update or delete on projects
for each row execute function log_audit();

drop trigger if exists trg_tasks_audit on tasks;
create trigger trg_tasks_audit after insert or update or delete on tasks
for each row execute function log_audit();
