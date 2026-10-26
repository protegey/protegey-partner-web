# syntax=docker/dockerfile:1

# --- Builder: full devDependencies, compiles the Next.js app. ---
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# Baked into the client bundle at build time — Next.js inlines every NEXT_PUBLIC_* var into the
# JS it ships to the browser, so unlike every other env var in this stack (read at container
# start), this one has to be supplied here, at image-build time. It's also the one piece of
# per-client configuration (each on-premise client has a different public URL) that makes this
# image not universally shareable across clients the way the API image is — see docker-compose
# .on-premise.yml's own comment on this.
ARG NEXT_PUBLIC_BACKEND_API_URL
ENV NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}

RUN pnpm run build

# --- Runtime: output:"standalone" (see next.config.ts) means this only needs the pruned
# server bundle it produces — no devDependencies, no full node_modules, no build toolchain. ---
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100
# Next.js standalone's server.js binds to `process.env.HOSTNAME || '0.0.0.0'` — and Docker itself
# always sets HOSTNAME to the container ID (confirmed via `docker exec ... echo $HOSTNAME`), which
# its own embedded DNS happily resolves to the container's bridge-network IP. Without this
# override the server ends up listening on only that one IP (e.g. 172.21.0.6:3100) — reachable
# from outside via the container's actual IP (which is how Docker's own port-forwarding NAT
# reaches it, so `curl http://localhost:7100` from the HOST still worked and masked this for a
# while) but NOT on the container's own loopback, which is exactly what this image's healthcheck
# (`wget --spider http://localhost:3100/login`) hits — it saw "connection refused" forever despite
# the app being fully up. Explicitly forcing 0.0.0.0 here is what makes both paths work.
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3100
CMD ["node", "server.js"]
