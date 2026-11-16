ARG NODE_VERSION=26.13.1

# Stage 1: Dependencies
FROM node:${NODE_VERSION}-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci

# Stage 2: Build
FROM node:${NODE_VERSION}-alpine AS builder

ARG APP_ENV=PROD
ARG BACK_INTERNAL_URL
ARG FRONT_HOST=front
ARG PORT=3000
ARG CI=false
ARG SENTRY_DSN
ARG NEXT_PUBLIC_BFF_PATH
ARG NEXT_PUBLIC_MOCK_MODE=false
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_FRONT_URL
ARG NEXT_PUBLIC_BACK_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_URL
ARG APP_NAME

ENV APP_ENV=${APP_ENV}
ENV BACK_INTERNAL_URL=${BACK_INTERNAL_URL}
ENV FRONT_HOST=${FRONT_HOST}
ENV PORT=${PORT}
ENV CI=${CI}
ENV SENTRY_DSN=${SENTRY_DSN}
ENV NEXT_PUBLIC_BFF_PATH=${NEXT_PUBLIC_BFF_PATH}
ENV NEXT_PUBLIC_MOCK_MODE=${NEXT_PUBLIC_MOCK_MODE}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_FRONT_URL=${NEXT_PUBLIC_FRONT_URL}
ENV NEXT_PUBLIC_BACK_URL=${NEXT_PUBLIC_BACK_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_URL=${SENTRY_URL}
ENV APP_NAME=${APP_NAME}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN,required=true npm run build

# Stage 3: Runner
FROM node:${NODE_VERSION}-alpine AS runner

ENV LOCALTIME=Europe/Moscow
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$LOCALTIME /etc/localtime && \
    echo $LOCALTIME > /etc/timezone

WORKDIR /app

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
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
