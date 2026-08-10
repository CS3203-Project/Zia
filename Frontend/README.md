# Zia Frontend (`Deployed_Frontend`)

React + TypeScript client for the Zia marketplace. Includes search, service flows, realtime messaging UI, payments, multilingual support, and admin views.

## Architecture Highlights

- **Framework**: React 19 + Vite
- **Routing**: React Router
- **State**: Context + hooks
- **Networking**: Axios + fetch for selected endpoints
- **Realtime**: Socket.IO client for chat
- **UI**: Tailwind CSS + custom components

## Performance Improvements Included

- Route-level lazy loading in `App.tsx`
- Optimized chat message ordering insertion path
- Nginx gzip + long-lived static asset cache in container runtime
- Reduced unnecessary chat profile refetch loops

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

See `.env.example`. Core variables:

- `VITE_API_BASE_URL`, `VITE_API_BASE_URL_PROD`
- `VITE_API_BASE_URL_MESSAGES`, `VITE_API_BASE_URL_MESSAGES_PROD`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

## Docker

```bash
docker compose up --build
```

This builds static assets and serves them from Nginx on port `8080`.

## Scripts

- `npm run dev` - local development
- `npm run build` - typecheck + production bundle
- `npm run preview` - local preview of built assets
- `npm run lint` - lint source

## Deployment Notes

- Point production API URLs to backend ingress endpoints.
- Keep Stripe and Google keys environment-specific.
- Prefer immutable static asset serving with SPA fallback.

## License

Licensed under ISC. See `LICENSE`.