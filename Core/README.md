# Zia Core Service

Core backend for the Zia marketplace platform: users, providers, companies, services,
categories, admin, reviews, service requests, scheduling, booking confirmations, in-app
notifications, semantic search, and Google Maps integration. Payments (PayHere) and
real-time chat now live in their own `Payment` and `Chat` microservices — this service
exposes a small internal `/internal/*` API so those services can look up user/service/
provider data over HTTP instead of querying this service's database directly.

## Core Architecture

- **HTTP API**: Express + route/controller/service layering
- **Persistence**: PostgreSQL via Prisma (`core` schema of the shared Zia database)
- **Async processing**: RabbitMQ (publishes booking-confirmation events consumed by the Chat service)
- **External providers**: Google Maps, Gemini embeddings (semantic search — optional, falls back to hash-based embeddings without an API key)
- **Internal API**: `/internal/*` — read-only lookups for the Payment and Chat services, protected by a shared `INTERNAL_API_KEY`

## Quick Start (Local)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client and run app:
   ```bash
   npm run build
   npm run dev
   ```

## Environment Variables

Use `.env.example` as the canonical template. Key groups:

- `DATABASE_URL`, `PORT`, `NODE_ENV`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `RABBITMQ_URL`
- `INTERNAL_API_KEY`, `CHAT_SERVICE_URL`
- `GEMINI_API_KEY`, `EMBEDDING_API_URL`, `EMBEDDING_MODEL`

## Docker

### Build and run with Compose

```bash
docker compose up --build
```

This brings up:
- `core` service
- `postgres` database
- `rabbitmq` broker (+ management UI)

## Scripts

- `npm run dev` - development runtime with `tsx`
- `npm run build` - Prisma generate + TypeScript build
- `npm run start` - run compiled output
- `npm run seed` - run seed script

## API Surface (High Level)

- `/api/users`, `/api/providers`, `/api/services`, `/api/categories`
- `/api/service-requests`, `/api/reviews`, `/api/notifications`
- `/api/confirmations`, `/api/schedule`, `/api/admin`
- `/internal/*` (users/services/providers/admins — internal service-to-service only)

Payments now live on the Payment service (`/api/payments/*`); real-time chat on the
Chat service (`/messaging` Socket.IO namespace + REST conversation/message endpoints).

## Deployment Notes

- Run database migrations before startup in production.
- Use strong `JWT_SECRET`/`INTERNAL_API_KEY` and rotate secrets per environment.
- Restrict CORS and ingress by environment; `/internal/*` should never be reachable outside the cluster.

## License

Licensed under ISC. See `LICENSE`.
