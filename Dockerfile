FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/*/package*.json ./packages/*/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the server
RUN cd apps/server && npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["sh", "-c", "cd apps/server && npm start"] 