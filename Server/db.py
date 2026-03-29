import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


load_dotenv()


def _db_config():
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "clothing_store"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres"),
        "sslmode": os.getenv("DB_SSLMODE", "prefer"),
        # Some managed/local setups clear default search_path.
        "options": os.getenv("DB_OPTIONS", "-c search_path=public"),
    }


def get_connection():
    return psycopg2.connect(**_db_config())


def check_connection():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
        return True, "connected"
    except Exception as exc:
        return False, str(exc)


def set_app_user_context(connection, user_id):
    """
    Sets per-request user context used by PostgreSQL RLS policies.
    Call this after opening a connection and before running user-scoped queries.
    """
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.user_id', %s, true);", (str(user_id),))


def initialize_database(schema_path=None):
    schema_file = Path(schema_path) if schema_path else Path(__file__).with_name("schema.sql")

    if not schema_file.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_file}")

    sql = schema_file.read_text(encoding="utf-8")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS public;")
            cursor.execute("SET search_path TO public;")

            # Execute statements sequentially so session settings (like search_path)
            # apply before table DDL is parsed.
            statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
            for statement in statements:
                cursor.execute("SET search_path TO public;")
                cursor.execute(statement + ";")
        conn.commit()
