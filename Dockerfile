# Site image: Astro build, then the static files served by Caddy (plain HTTP on :8080).
# HTTPS and the domain are handled by the Caddy on the server, which proxies to this container.
FROM node:24-slim AS build
WORKDIR /app
# The share image (src/pages/og) is drawn by librsvg, which needs system fonts: the slim image has none.
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
