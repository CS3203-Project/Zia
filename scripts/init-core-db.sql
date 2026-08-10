-- Runs once, on first startup of the shared "zia_core" Postgres database.
-- Core, Chat, and Payment each own one schema (namespace) inside this single database,
-- migrated independently by each service's own Prisma project.
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS payment;

-- Core's schema.prisma also declares the postgis/vector extensions for geo + embedding
-- columns. The plain postgres:16-alpine image here doesn't bundle them (same gap that
-- predates this split) — use a postgis/pgvector-enabled Postgres image if you need those
-- features working locally, and CREATE EXTENSION postgis / vector once connected.
