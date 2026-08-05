# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.18

FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Stage 1: Dependencies
FROM base AS deps

COPY package.json package-lock.json .npmrc ./
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json ./packages/api/

RUN npm ci

# Stage 2: Development
FROM base AS development

ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# Stage 3: Production build
FROM base AS builder

ARG APP_ENV
ARG APP_NAME
ARG BACK_INTERNAL_URL
ARG CI
ARG FRONT_HOST
ARG MOCK_MODE
ARG PORT
ARG SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_BACK_URL
ARG NEXT_PUBLIC_BFF_PATH
ARG NEXT_PUBLIC_FRONT_URL
ARG NEXT_PUBLIC_MOCK_MODE
ARG NEXT_PUBLIC_SENTRY_DSN

ENV APP_ENV=${APP_ENV}
ENV APP_NAME=${APP_NAME}
ENV BACK_INTERNAL_URL=${BACK_INTERNAL_URL}
ENV CI=${CI}
ENV FRONT_HOST=${FRONT_HOST}
ENV MOCK_MODE=${MOCK_MODE}
ENV PORT=${PORT}
ENV SENTRY_DSN=${SENTRY_DSN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_URL=${SENTRY_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_BACK_URL=${NEXT_PUBLIC_BACK_URL}
ENV NEXT_PUBLIC_BFF_PATH=${NEXT_PUBLIC_BFF_PATH}
ENV NEXT_PUBLIC_FRONT_URL=${NEXT_PUBLIC_FRONT_URL}
ENV NEXT_PUBLIC_MOCK_MODE=${NEXT_PUBLIC_MOCK_MODE}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

# Build-time cache handler loading validates server env but never contacts this endpoint.
ENV VALKEY_URL=redis://127.0.0.1:6379
ENV VALKEY_CACHE_NAMESPACE=nextjs-starter:build:v1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=sentry_auth_token,required=true \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" npm run build

# Stage 4: Production runner
FROM base AS runner

ENV LOCALTIME=Europe/Moscow
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$LOCALTIME /etc/localtime && \
    echo $LOCALTIME > /etc/timezone

ENV NODE_ENV=production

RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Standalone сборка включает минимальный набор файлов
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
