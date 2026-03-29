from pathlib import Path

from db import get_connection


def main():
    sql = Path("least_privilege_roles.sql").read_text(encoding="utf-8")
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT rolname
                FROM pg_roles
                WHERE rolname IN ('db_migrator', 'db_app', 'app_user', 'readonly_user', 'db_admin')
                ORDER BY rolname;
                """
            )
            roles = [r[0] for r in cur.fetchall()]

            cur.execute(
                """
                SELECT grantee, privilege_type
                FROM information_schema.role_table_grants
                WHERE table_schema = 'public'
                  AND table_name = 'login_sessions'
                  AND grantee IN ('db_app', 'app_user', 'readonly_user', 'db_admin')
                ORDER BY grantee, privilege_type;
                """
            )
            login_session_grants = cur.fetchall()

            cur.execute(
                """
                SELECT r.rolname AS member, p.rolname AS parent
                FROM pg_auth_members m
                JOIN pg_roles r ON r.oid = m.member
                JOIN pg_roles p ON p.oid = m.roleid
                WHERE r.rolname IN ('app_user', 'readonly_user', 'db_admin')
                ORDER BY r.rolname, p.rolname;
                """
            )
            memberships = cur.fetchall()

            cur.execute(
                """
                SELECT c.relacl
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname = 'login_sessions';
                """
            )
            relacl = cur.fetchone()[0]

            cur.execute(
                """
                SELECT
                    has_schema_privilege('app_user', 'public', 'CREATE'),
                    has_schema_privilege('readonly_user', 'public', 'CREATE');
                """
            )
            app_create, read_create = cur.fetchone()

            cur.execute(
                """
                SELECT
                    EXISTS (SELECT 1 FROM pg_roles WHERE rolname='db_app'),
                    EXISTS (SELECT 1 FROM pg_roles WHERE rolname='db_migrator');
                """
            )
            db_app_exists, db_migrator_exists = cur.fetchone()

            print(f"ROLES={roles}")
            print(f"DB_APP_EXISTS={db_app_exists}")
            print(f"DB_MIGRATOR_EXISTS={db_migrator_exists}")
            print(f"LOGIN_SESSIONS_GRANTS={login_session_grants}")
            print(f"ROLE_MEMBERSHIPS={memberships}")
            print(f"LOGIN_SESSIONS_RELACL={relacl}")
            print(f"SCHEMA_CREATE_APP_USER={app_create}")
            print(f"SCHEMA_CREATE_READONLY_USER={read_create}")


if __name__ == "__main__":
    main()
