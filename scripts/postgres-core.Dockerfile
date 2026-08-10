# Core's schema needs both postgis (location columns) and pgvector (embedding columns).
# postgis/postgis ships postgis; pgvector is added on top via the pgvector project's own
# apt package for this Postgres major version.
FROM postgis/postgis:16-3.4

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-pgvector \
    && rm -rf /var/lib/apt/lists/*
