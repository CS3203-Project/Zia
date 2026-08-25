-- Two indexes that were missing entirely, each turning a full sequential scan into an
-- index scan on Core's two hottest read paths (semantic search, location radius search).
-- Prisma's schema DSL can't express either of these (vector opclasses / expression
-- indexes aren't representable in schema.prisma), so they're raw SQL only — see the
-- comment on the Service model in schema.prisma.
--
-- Not run CONCURRENTLY: Prisma applies each migration inside a transaction, and
-- CREATE INDEX CONCURRENTLY cannot run inside one. That's fine at this project's current
-- data volume; if the Service table is ever large and already under live traffic when
-- this runs, apply the two statements below manually with CONCURRENTLY outside of
-- `prisma migrate deploy` instead.

-- Speeds up semantic search's `combinedEmbedding <=> query` similarity search
-- (semantic-search.service.ts) from an O(n) sequential scan over every service to an
-- approximate-nearest-neighbor index lookup. vector_cosine_ops because the query uses
-- the <=> (cosine distance) operator specifically — the wrong opclass silently makes the
-- index unusable for that operator. Partial: many rows won't have an embedding yet.
CREATE INDEX IF NOT EXISTS "Service_combinedEmbedding_hnsw_idx"
  ON "Service" USING hnsw ("combinedEmbedding" vector_cosine_ops)
  WHERE "combinedEmbedding" IS NOT NULL;

-- Speeds up searchServicesByLocation()'s ST_DWithin(...) radius filter
-- (services.service.ts) from a full sequential scan to a GiST index scan. The existing
-- btree @@index([latitude, longitude]) can't serve this — the query filters on a
-- computed geography-cast expression, not the raw columns, so a plain btree on the
-- columns is never even considered by the planner for this predicate.
--
-- IMPORTANT: this expression must stay byte-for-byte identical to the one in
-- searchServicesByLocation()'s SQL (ST_SetSRID(ST_MakePoint(s.longitude, s.latitude),
-- 4326)::geography) or Postgres won't match the query to the index. If that query's
-- expression ever changes, update this index in the same change.
CREATE INDEX IF NOT EXISTS "Service_location_gist_idx"
  ON "Service" USING gist (
    (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography)
  )
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
