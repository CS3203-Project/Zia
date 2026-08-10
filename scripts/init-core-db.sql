-- Runs once, on first startup of the shared "zia_core" Postgres database.
-- Core uses the database's default "public" schema (its 35-migration history predates
-- this split and several migrations hardcode "public" — safer to leave it there than
-- rewrite immutable migration SQL). Chat and Payment, with fresh migration histories,
-- each get their own dedicated schema below.
CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS payment;

-- Core's schema.prisma also declares the postgis/vector extensions for geo + embedding
-- columns. The plain postgres:16-alpine image here doesn't bundle them (same gap that
-- predates this split) — use a postgis/pgvector-enabled Postgres image if you need those
-- features working locally, and CREATE EXTENSION postgis / vector once connected.
