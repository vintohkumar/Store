-- Security hardening: role model + grants + RLS
-- Run as db_admin (or superuser) against clothing_store.

BEGIN;

-- -------------------------------------------------------------------
-- 1) Base roles (optional; requires CREATEROLE)
-- -------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_app_base') THEN
            CREATE ROLE role_app_base NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_read_base') THEN
            CREATE ROLE role_read_base NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_admin_base') THEN
            CREATE ROLE role_admin_base NOLOGIN;
        END IF;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Skipping base role creation (requires CREATEROLE).';
    END;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_app_base') THEN
        GRANT role_app_base TO app_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_read_base') THEN
        GRANT role_read_base TO readonly_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_admin_base') THEN
        GRANT role_admin_base TO db_admin;
    END IF;
END
$$;

-- -------------------------------------------------------------------
-- 2) Schema and default deny policy
-- -------------------------------------------------------------------
REVOKE ALL ON DATABASE clothing_store FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

GRANT CONNECT ON DATABASE clothing_store TO app_user, readonly_user, db_admin;
GRANT USAGE ON SCHEMA public TO app_user, readonly_user;
GRANT ALL ON SCHEMA public TO db_admin;

-- -------------------------------------------------------------------
-- 3) Table and sequence privileges
-- -------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM app_user;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_admin;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user, db_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly_user;

-- Sensitive auth table should not be directly accessible to app/read roles.
REVOKE ALL ON TABLE public.login_sessions FROM app_user, readonly_user;

-- Future-proof default privileges for new tables/sequences created by db_admin.
ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public
GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public
GRANT SELECT ON TABLES TO readonly_user;

ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO db_admin;

ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user, db_admin;

ALTER DEFAULT PRIVILEGES FOR ROLE db_admin IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO readonly_user;

-- -------------------------------------------------------------------
-- 4) Row-Level Security (user isolation)
-- Backend must set: SET app.user_id = '<uuid>';
-- -------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.carts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_select ON public.users;
DROP POLICY IF EXISTS users_self_update ON public.users;
DROP POLICY IF EXISTS users_self_insert ON public.users;

CREATE POLICY users_self_select ON public.users
FOR SELECT
TO app_user
USING (id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY users_self_update ON public.users
FOR UPDATE
TO app_user
USING (id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY users_self_insert ON public.users
FOR INSERT
TO app_user
WITH CHECK (id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS user_profiles_owner_policy ON public.user_profiles;
CREATE POLICY user_profiles_owner_policy ON public.user_profiles
FOR ALL
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS user_addresses_owner_policy ON public.user_addresses;
CREATE POLICY user_addresses_owner_policy ON public.user_addresses
FOR ALL
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS orders_owner_policy ON public.orders;
CREATE POLICY orders_owner_policy ON public.orders
FOR ALL
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS carts_owner_policy ON public.carts;
CREATE POLICY carts_owner_policy ON public.carts
FOR ALL
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS cart_items_owner_policy ON public.cart_items;
CREATE POLICY cart_items_owner_policy ON public.cart_items
FOR ALL
TO app_user
USING (
    EXISTS (
        SELECT 1
        FROM public.carts c
        WHERE c.id = cart_id
          AND c.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.carts c
        WHERE c.id = cart_id
          AND c.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
);

DROP POLICY IF EXISTS wishlists_owner_policy ON public.wishlists;
CREATE POLICY wishlists_owner_policy ON public.wishlists
FOR ALL
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS reviews_owner_policy ON public.reviews;
CREATE POLICY reviews_owner_policy ON public.reviews
FOR ALL
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS login_sessions_owner_policy ON public.login_sessions;
CREATE POLICY login_sessions_owner_policy ON public.login_sessions
FOR SELECT
TO app_user
USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

DROP POLICY IF EXISTS order_items_owner_policy ON public.order_items;
CREATE POLICY order_items_owner_policy ON public.order_items
FOR SELECT
TO app_user
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_id
          AND o.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
);

DROP POLICY IF EXISTS payments_owner_policy ON public.payments;
CREATE POLICY payments_owner_policy ON public.payments
FOR SELECT
TO app_user
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_id
          AND o.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
);

COMMIT;
