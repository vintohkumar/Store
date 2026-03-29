CREATE DATABASE clothing_store;

CREATE ROLE db_admin WITH LOGIN PASSWORD '#RD0896#';

-- Application role
CREATE ROLE app_user WITH LOGIN PASSWORD 'guest';

-- Read-only role
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'guest';


-- Admin (full control)
GRANT ALL PRIVILEGES ON DATABASE clothing_store TO db_admin;

-- App user (limited)
GRANT CONNECT ON DATABASE clothing_store TO app_user;

-- Read-clothing_store
GRANT CONNECT ON DATABASE clothing_store TO readonly_user;


REVOKE ALL ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO app_user;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;