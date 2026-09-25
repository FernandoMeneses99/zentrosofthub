-- 027_client_role: permitir tenant_role='client' (NO aplicado).
-- Las migraciones anteriores dejan el CHECK original sin 'client'.
DO $$
DECLARE o oid; n text;
BEGIN
  FOR o IN
    SELECT c.oid FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'organization_members'::regclass
      AND c.contype = 'c' AND a.attname = 'tenant_role'
  LOOP
    SELECT conname INTO n FROM pg_constraint WHERE oid = o;
    EXECUTE 'ALTER TABLE organization_members DROP CONSTRAINT ' || quote_ident(n);
  END LOOP;
END $$;

ALTER TABLE organization_members ADD CONSTRAINT organization_members_tenant_role_check
  CHECK (tenant_role IN ('owner','admin','manager','employee','viewer','client'));
