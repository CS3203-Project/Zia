# Zia Common Service (`Deployed_Com`)

Shared communication and messaging service built with NestJS + TypeORM. This module supports conversation APIs, websocket broadcasting, queue-based async workflows, and confirmation synchronization.

## Architecture Overview

- **Framework**: NestJS (modular architecture)
- **Transport**: REST + WebSocket gateway
- **Persistence**: PostgreSQL via TypeORM
- **Queueing**: RabbitMQ integration
- **Validation**: Global validation pipe with transform + whitelist

## Reliability and Performance Focus

- Pagination bounds to prevent unbounded queries
- Request validation hardening
- Conversation mapping consistency fixes
- Authorization hardening for actor-sensitive messaging routes
- Containerized deployment for predictable runtime

## Quick Start

```bash
npm install
cp .env.example .env
npm run build
npm run start:dev
```

## Environment Variables

Defined in `.env.example`:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `RABBITMQ_URL`
- `INTERNAL_API_KEY`

## Docker

```bash
docker compose up --build
```

Compose includes:
- `common-service`
- `postgres`
- `rabbitmq`

## Useful Scripts

- `npm run start:dev` - watch mode
- `npm run build` - compile Nest app
- `npm run start:prod` - run compiled app
- `npm run lint` - lint and auto-fix

## Module Structure

- `src/modules/messeging` - conversations/messages/gateway
- `src/modules/confirmation` - confirmation broadcast endpoints
- `src/modules/queue` - queue producer utilities
- `src/modules/email` - email workflows

## Deployment Notes

- Keep `INTERNAL_API_KEY` private and rotate regularly.
- Restrict ingress to trusted services for broadcast endpoints.
- Run with managed Postgres and managed queue in production.

## License

This repository is proprietary/unlicensed. See `LICENSE`.
