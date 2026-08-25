# Zia on Kubernetes (local kind cluster)

This deploys all 4 backend services (Core, Chat, Payment, Notification) plus the
Frontend to a local [kind](https://kind.sigs.k8s.io/) cluster. Manifests are numbered
in apply order; `kubectl apply -f k8s/` applies them all (Kubernetes doesn't actually
care about order for most resources, but reading them in this order tells the story).

## Prerequisites

- Docker Desktop running
- `kind` and `kubectl` installed (`choco install kind kubernetes-cli` on Windows, or see kind's install docs)

## 1. Create the cluster

```bash
kind create cluster --config k8s/kind-config.yaml --name zia
```

## 2. Install the ingress controller

kind ships a variant of ingress-nginx pre-wired for the `extraPortMappings` in
`kind-config.yaml`:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

## 3. Build and load the service images

kind runs its own Docker daemon inside the cluster's node container — it can't see
images from your host's `docker build` unless you explicitly load them:

```bash
docker build -t zia/core:dev ./Core
docker build -t zia/chat:dev ./Chat
docker build -t zia/payment:dev ./Payment
docker build -t zia/notification:dev ./Notification
docker build -t zia/frontend:dev ./Frontend

kind load docker-image zia/core:dev --name zia
kind load docker-image zia/chat:dev --name zia
kind load docker-image zia/payment:dev --name zia
kind load docker-image zia/notification:dev --name zia
kind load docker-image zia/frontend:dev --name zia
```

Re-run both the `docker build` and `kind load docker-image` steps for a service every
time you change its code — there's no auto-rebuild loop here.

## 4. Create the namespace and secrets

```bash
kubectl apply -f k8s/00-namespace.yaml
```

Secrets are created imperatively from your existing `.env` files rather than committed
as YAML (even placeholder values in a committed Secret manifest are an easy way to
accidentally leak something real later):

```bash
kubectl create secret generic core-secrets -n zia \
  --from-literal=JWT_SECRET=<value from Core/.env> \
  --from-literal=JWT_EXPIRES_IN=24h \
  --from-literal=INTERNAL_API_KEY=<value from Core/.env> \
  --from-literal=GEMINI_API_KEY= \
  --from-literal=EMBEDDING_API_URL= \
  --from-literal=EMBEDDING_MODEL= \
  --from-literal=MINIO_ACCESS_KEY=<same value as MINIO_ROOT_USER below> \
  --from-literal=MINIO_SECRET_KEY=<same value as MINIO_ROOT_PASSWORD below>

kubectl create secret generic minio-secrets -n zia \
  --from-literal=MINIO_ROOT_USER=minioadmin \
  --from-literal=MINIO_ROOT_PASSWORD=minioadmin

kubectl create secret generic chat-secrets -n zia \
  --from-literal=JWT_SECRET=<same value as core> \
  --from-literal=INTERNAL_API_KEY=<same value as core>

kubectl create secret generic payment-secrets -n zia \
  --from-literal=JWT_SECRET=<same value as core> \
  --from-literal=INTERNAL_API_KEY=<same value as core> \
  --from-literal=PAYHERE_MERCHANT_ID=<value from Payment/.env> \
  --from-literal=PAYHERE_MERCHANT_SECRET=<value from Payment/.env> \
  --from-literal=PAYHERE_APP_ID= \
  --from-literal=PAYHERE_APP_SECRET=

kubectl create secret generic notification-secrets -n zia \
  --from-literal=INTERNAL_API_KEY=<same value as core> \
  --from-literal=MAIL_USER=<value from Notification/.env> \
  --from-literal=MAIL_PASS=<value from Notification/.env> \
  --from-literal=MAIL_FROM="Zia <value from Notification/.env>"
```

`JWT_SECRET` and `INTERNAL_API_KEY` must be identical across core/chat/payment (and
notification for the internal key) — they're how services trust each other and
verify user tokens.

`minio-secrets`' `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` are consumed three ways: by the
MinIO Deployment itself (root credentials), by the one-shot `minio-createbuckets` Job
(to authenticate `mc`), and — under the differently-named keys
`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` in `core-secrets` — by Core's S3-API client
(Core/src/utils/s3.ts). All three must carry the same values; there's no cross-reference
between the two Secrets, so if you change one you must change the other.

Redis (`12-redis.yaml`) needs no Secret — it runs unauthenticated, same as in
docker-compose. That's fine for this local/dev cluster but is a real gap for a
production deployment (anyone who can reach the Service can read/write everything in
it); add `requirepass` (or a managed Redis with auth) before running this anywhere
Internet-reachable.

## 5. Apply everything else

```bash
kubectl apply -f k8s/
```

## 6. Sync each service's schema

The Postgres pod starts empty. From your machine (not in-cluster), port-forward it and
sync each service's schema:

```bash
kubectl port-forward -n zia svc/postgres-core 5432:5432 &
```

**Core** uses the database's default `public` schema, and its 35-migration history
predates this split — a handful of those migrations turned out to reference objects
(an index, an embedding column) that were apparently created by hand on the original
dev database rather than through a migration, so replaying the full history with
`migrate deploy` fails partway through on a genuinely empty database. Use `db push`
instead, which syncs the live schema directly and skips replaying history (fine here —
this is a fresh database, not one with production data to preserve migration lineage for):

```bash
cd Core && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zia_core" npx prisma db push
```

**Chat** and **Payment** have fresh, gap-free migration histories (created as part of
this split) — use the normal migration flow for those:

```bash
cd Chat && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zia_core?schema=chat" npx prisma migrate deploy
cd Payment && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zia_core?schema=payment" npx prisma migrate deploy
```

## 7. Point PAYHERE_NOTIFY_URL and MINIO_PUBLIC_URL at something reachable

`k8s/01-configmaps.yaml`'s `PAYHERE_NOTIFY_URL` is a placeholder — PayHere calls this
over the public internet, so it must be your actual ingress host once you have one
(a cloud load balancer IP/DNS name, or a tunnel for local testing). Update the
ConfigMap and restart the `payment` Deployment after changing it.

Similarly, `MINIO_PUBLIC_URL` (also in `core-config`) is the host Core prepends to the
URLs it hands back for uploaded images/videos — it builds the full URL as
`{MINIO_PUBLIC_URL}/zia-uploads/<key>`, so this must be **just the ingress host, with no
path** (it defaults to `http://localhost:8080`, matching the ingress host
`kind-config.yaml` maps to your machine; the `/zia-uploads` portion of the final URL
comes from the bucket name the app code appends, and is what the `/zia-uploads` rule in
`11-ingress.yaml` routes to MinIO). If you change the ingress host (a real domain, a
different port), update `MINIO_PUBLIC_URL` to match and restart the `core` Deployment,
or uploaded-file URLs in API responses will point somewhere nothing is listening.

## 8. Verify

```bash
kubectl get pods -n zia
kubectl get ingress -n zia
```

Visit `http://localhost:8080` (the host port mapped in `kind-config.yaml`) for the
frontend. `kubectl logs -n zia deploy/<name>` for any service having trouble starting.

## Rebuilding after a code change

```bash
docker build -t zia/core:dev ./Core && kind load docker-image zia/core:dev --name zia
kubectl rollout restart deployment/core -n zia
```

## Known limitations of this setup

- Redis (`12-redis.yaml`) runs unauthenticated, matching docker-compose — a real gap if
  this were ever deployed somewhere network-reachable. See the Redis note under step 4.
- No TLS/cert-manager configured — this is a local dev cluster, not a production one.
- The Frontend image bakes `VITE_*` URLs in at build time — if you change
  `Frontend/.env`, you must rebuild and reload the `zia/frontend:dev` image, not just
  restart the pod.
- MinIO (`13-minio.yaml`) runs as a single unauthenticated-console, single-replica pod
  with root credentials shared across every consumer (see step 4) — fine for local dev,
  but swap in real AWS S3 (or a properly access-controlled MinIO deployment) for
  production by changing `MINIO_ENDPOINT`/credentials; the app code only ever talks to
  the S3 API (Core/src/utils/s3.ts), so nothing else needs to change.
