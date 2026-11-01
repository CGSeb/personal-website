# Site image: Astro build, then the static files served by Caddy (plain HTTP on :8080).
# HTTPS and the domain are handled by the Caddy on the server, which proxies to this container.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
