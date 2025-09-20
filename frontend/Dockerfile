FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* tsconfig.json next.config.ts postcss.config.js tailwind.config.ts ./
COPY src ./src
RUN corepack enable && corepack prepare pnpm@10.4.0 --activate && pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]


