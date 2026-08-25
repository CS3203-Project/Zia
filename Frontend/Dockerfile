FROM node:20-alpine AS build
WORKDIR /app

# Vite inlines import.meta.env.* at BUILD time, so these must be present here —
# setting them on the running container does nothing. Without them the bundle
# fell back to the localhost URLs from a developer's .env (which is gitignored,
# so CI never had it), and every visitor's browser tried to call their own
# machine on :3000.
#
# Defaults are same-origin paths: nginx proxies /api and /messaging to the
# services, so no domain is baked into the bundle and CORS never applies.
ARG VITE_API_BASE_URL_PROD=/api
ARG VITE_API_BASE_URL_MESSAGES_PROD=/messaging
ARG VITE_API_BASE_URL_PAYMENTS_PROD=/api
ENV VITE_API_BASE_URL_PROD=$VITE_API_BASE_URL_PROD \
    VITE_API_BASE_URL_MESSAGES_PROD=$VITE_API_BASE_URL_MESSAGES_PROD \
    VITE_API_BASE_URL_PAYMENTS_PROD=$VITE_API_BASE_URL_PAYMENTS_PROD

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
