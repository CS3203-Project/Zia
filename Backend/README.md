# Zia Backend (`Deployed_backend`)

Production backend for the Zia marketplace platform. This service exposes REST APIs, Socket.IO chat events, Stripe webhooks, background queue integrations, and Prisma-backed persistence.

## Core Architecture

- **HTTP API**: Express + route/controller/service layering
- **Realtime**: Socket.IO namespace for messaging and read receipts
- **Persistence**: PostgreSQL via Prisma
- **Async processing**: RabbitMQ queue service
- **External providers**: Stripe, AWS S3/SES, Google Maps, Gemini embeddings

## Performance and Reliability Enhancements

- Single shared Prisma client to reduce connection churn
- Hardened socket auth/authorization flow (identity bound server-side)
- Raw-body Stripe webhook verification path
- Route-level code and service separation for easier scaling
- Dockerized runtime with multi-stage image builds

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
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
- `GOOGLE_MAPS_API_KEY`, `GEMINI_API_KEY`, `EMBEDDING_API_URL`, `EMBEDDING_MODEL`

## Docker

### Build and run with Compose

```bash
docker compose up --build
```

This brings up:
- `backend` service
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
- `/api/payments` (including `/webhook`)
- `/api/confirmations`, `/api/schedule`, `/api/chatbot`
- Socket.IO namespace: `/messaging`

## Deployment Notes

- Run database migrations before startup in production.
- Ensure Stripe webhook endpoint receives raw JSON payload.
- Use strong `JWT_SECRET` and rotate secrets per environment.
- Restrict CORS and ingress by environment.

## License

Licensed under ISC. See `LICENSE`.