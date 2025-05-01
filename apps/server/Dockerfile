FROM node:20-alpine

WORKDIR /app

ARG VERSION
ARG SHA
RUN echo "{\"version\":\"$VERSION\",\"sha\":\"$SHA\"}" > build.json

# Copy root workspace files
COPY ../../package.json ../../package-lock.json ./

# Copy scripts
COPY ../../scripts scripts

# Copy all package.json files first
COPY ../../packages/core/package.json packages/core/package.json
COPY ../../packages/crdt/package.json packages/crdt/package.json
COPY ../../apps/server/package.json apps/server/package.json

# Install dependencies
RUN npm ci

# Copy source files
COPY ../../packages/core packages/core
COPY ../../packages/crdt packages/crdt
COPY ../../apps/server apps/server
COPY ../../tsconfig.base.json ./

# Build packages
RUN npm run build -w @colanode/core && \
    npm run build -w @colanode/crdt && \
    npm run build -w @colanode/server && \
    npm prune --production

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
