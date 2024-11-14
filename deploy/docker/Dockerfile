# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files first
COPY packages/core/package.json ./packages/core/
COPY packages/crdt/package.json ./packages/crdt/
COPY apps/server/package.json ./apps/server/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/core ./packages/core
COPY packages/crdt ./packages/crdt
COPY apps/server ./apps/server
COPY tsconfig.base.json ./

# Build packages
RUN pnpm --filter "@colanode/core" build
RUN pnpm --filter "@colanode/crdt" build
RUN pnpm --filter "@colanode/server" build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY ../../pnpm-workspace.yaml ../../package.json ../../pnpm-lock.yaml ./

# Copy all package.json files
COPY ../../packages/core/package.json packages/core/package.json
COPY ../../packages/crdt/package.json packages/crdt/package.json
COPY ../../apps/server/package.json apps/server/package.json

# Copy built files
COPY --from=builder /app/packages/core/dist packages/core/dist
COPY --from=builder /app/packages/crdt/dist packages/crdt/dist
COPY --from=builder /app/apps/server/dist apps/server/dist

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]