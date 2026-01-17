# Stage 1: Dependencies
FROM oven/bun:1.3 AS deps

WORKDIR /app

COPY package.json bun.lockb ./
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json ./packages/api/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/ts-config/package.json ./packages/ts-config/

RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.3 AS builder

ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_FRONT_URL
ARG NEXT_PUBLIC_BACK_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_URL
ARG APP_NAME

ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_FRONT_URL=${NEXT_PUBLIC_FRONT_URL}
ENV NEXT_PUBLIC_BACK_URL=${NEXT_PUBLIC_BACK_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_URL=${SENTRY_URL}
ENV APP_NAME=${APP_NAME}

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.3 AS runner

ENV LOCALTIME=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$LOCALTIME /etc/localtime && echo $LOCALTIME > /etc/timezone

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Standalone сборка включает минимальный набор файлов
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "prod"]

