-- Least-privilege role split for production readiness.
-- Goal:
--   - db_migrator: schema changes (DDL)
--   - db_app: runtime CRUD only (no DDL)
--
-- Notes:
--   - Creating roles requires CREATEROLE privilege.
--   - If current user lacks CREATEROLE, script still applies grant/revoke
--     controls to existing app_user/read_only roles where possible.

BEGIN;

-- -------------------------------------------------------------------
-- 1) Create roles if allowed
-- -------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_migrator') THEN
            CREATE ROLE db_migrator LOGIN PASSWORD 'change_me_migrator';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_app') THEN
            CREATE ROLE db_app LOGIN PASSWORD 'change_me_db_app';
        END IF;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Skipping db_migrator/db_app creation (requires CREATEROLE).';
    END;
END
$$;

-- -------------------------------------------------------------------
-- 2) Baseline hardening
-- -------------------------------------------------------------------
REVOKE ALL ON DATABASE clothing_store FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- -------------------------------------------------------------------
-- 3) db_migrator privileges (DDL role)
-- -------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_migrator') THEN
        GRANT CONNECT ON DATABASE clothing_store TO db_migrator;
        GRANT USAGE, CREATE ON SCHEMA public TO db_migrator;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_migrator;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_migrator;

        ALTER DEFAULT PRIVILEGES FOR ROLE db_migrator IN SCHEMA public
        GRANT ALL PRIVILEGES ON TABLES TO db_migrator;

        ALTER DEFAULT PRIVILEGES FOR ROLE db_migrator IN SCHEMA public
        GRANT ALL PRIVILEGES ON SEQUENCES TO db_migrator;
    END IF;
END
$$;

-- -------------------------------------------------------------------
-- 4) db_app privileges (runtime role, no DDL)
-- -------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_app') THEN
        GRANT CONNECT ON DATABASE clothing_store TO db_app;
        GRANT USAGE ON SCHEMA public TO db_app;

        GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO db_app;
        REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM db_app;
        REVOKE ALL ON TABLE public.login_sessions FROM db_app;

        GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO db_app;

        ALTER DEFAULT PRIVILEGES FOR ROLE db_migrator IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE ON TABLES TO db_app;
        ALTER DEFAULT PRIVILEGES FOR ROLE db_migrator IN SCHEMA public
        GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO db_app;
    END IF;
END
$$;

-- -------------------------------------------------------------------
-- 5) Keep existing roles aligned as fallback
-- -------------------------------------------------------------------
GRANT CONNECT ON DATABASE clothing_store TO app_user, readonly_user, db_admin;
GRANT USAGE ON SCHEMA public TO app_user, readonly_user;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM app_user;
REVOKE ALL ON TABLE public.login_sessions FROM app_user, readonly_user;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_app_base') THEN
        REVOKE ALL ON TABLE public.login_sessions FROM role_app_base;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_read_base') THEN
        REVOKE ALL ON TABLE public.login_sessions FROM role_read_base;
    END IF;
END
$$;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_admin;

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user, db_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly_user;

-- Enforce sensitive-table deny after broad grants.
REVOKE ALL ON TABLE public.login_sessions FROM app_user, readonly_user;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_app') THEN
        REVOKE ALL ON TABLE public.login_sessions FROM db_app;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_app_base') THEN
        REVOKE ALL ON TABLE public.login_sessions FROM role_app_base;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_read_base') THEN
        REVOKE ALL ON TABLE public.login_sessions FROM role_read_base;
    END IF;
END
$$;

-- Remove schema create rights from runtime roles.
REVOKE CREATE ON SCHEMA public FROM app_user, readonly_user;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'db_app') THEN
        REVOKE CREATE ON SCHEMA public FROM db_app;
    END IF;
END
$$;

COMMIT;
