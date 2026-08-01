FROM node:22-bookworm-slim AS build

WORKDIR /app

# Prisma validates the datasource while generating the client; this placeholder is
# build-only and is never used by the running container.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/talentiq

RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist
# Prisma's generated JavaScript client imports companion TypeScript files. Keep
# the generated source tree beside the compiled application at its resolved path.
COPY --from=build /app/generated ./dist/generated

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
