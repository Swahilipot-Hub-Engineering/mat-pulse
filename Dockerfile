# Multi-stage Docker build for Mat-Pulse
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY tests ./tests
COPY vitest.config.ts ./

# Run tests and compile TypeScript
RUN npm test && npm run build

# Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/public ./dist/public
COPY --from=builder /app/src/gtfs/static/*.json ./dist/gtfs/static/

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
