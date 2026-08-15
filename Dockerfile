# --- Stage 1: build the Hugo site + Pagefind index ---------------------------
FROM hugomods/hugo:exts-0.151.2 AS build

WORKDIR /src
COPY . .

# Build static site (minified) then generate the client-side search index.
RUN hugo --minify --gc
RUN npx -y pagefind --site public

# --- Stage 2: serve with Caddy ----------------------------------------------
FROM caddy:2-alpine

COPY --from=build /src/public /srv
COPY Caddyfile /etc/caddy/Caddyfile
