FROM node:22-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy scripts
COPY ../../scripts scripts

# Copy all package.json files first
COPY ../../packages/core/package.json packages/core/package.json
COPY ../../packages/crdt/package.json packages/crdt/package.json
COPY ../../packages/client/package.json packages/client/package.json
COPY ../../packages/ui/package.json packages/ui/package.json
COPY ../../apps/web/package.json apps/web/package.json

# Install dependencies
RUN npm ci

# Copy source files
COPY ../../packages/core packages/core
COPY ../../packages/crdt packages/crdt
COPY ../../packages/client packages/client
COPY ../../packages/ui packages/ui
COPY ../../apps/web apps/web
COPY ../../tsconfig.base.json ./

# Build packages
RUN npm run build -w @colanode/core && \
    npm run build -w @colanode/crdt && \
    npm run build -w @colanode/client && \
    npm run build -w @colanode/ui && \
    npm run build -w @colanode/web && \
    npm prune --production


FROM nginx:1.27-alpine

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
