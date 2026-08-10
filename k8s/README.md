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
  --from-literal=GOOGLE_MAPS_API_KEY=<value from Core/.env> \
  --from-literal=GEMINI_API_KEY= \
  --from-literal=EMBEDDING_API_URL= \
  --from-literal=EMBEDDING_MODEL=

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

## 5. Apply everything else

```bash
kubectl apply -f k8s/
```

## 6. Run the per-service Prisma migrations

The Postgres pods start empty. From your machine (not in-cluster), run each service's
migration against the cluster's Postgres by temporarily port-forwarding it:

```bash
kubectl port-forward -n zia svc/postgres-core 5432:5432 &
# then, in Core/, Chat/, Payment/ respectively, with DATABASE_URL pointed at localhost:5432
# and the right ?schema=core|chat|payment:
npx prisma migrate deploy
```

## 7. Point PAYHERE_NOTIFY_URL at something PayHere can reach

`k8s/01-configmaps.yaml`'s `PAYHERE_NOTIFY_URL` is a placeholder — PayHere calls this
over the public internet, so it must be your actual ingress host once you have one
(a cloud load balancer IP/DNS name, or a tunnel for local testing). Update the
ConfigMap and restart the `payment` Deployment after changing it.

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

- Chat's Socket.IO presence state is in-memory — stays at `replicas: 1` until a shared
  adapter (e.g. Redis) is added.
- No TLS/cert-manager configured — this is a local dev cluster, not a production one.
- The Frontend image bakes `VITE_*` URLs in at build time — if you change
  `Frontend/.env`, you must rebuild and reload the `zia/frontend:dev` image, not just
  restart the pod.
