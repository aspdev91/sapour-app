FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package.json pnpm-lock.yaml* .npmrc ./
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate && pnpm fetch || true

# Build
COPY . .
RUN pnpm install --frozen-lockfile=false && pnpm build

EXPOSE 3001
CMD ["node", "dist/main.js"]

