FROM node:20.12 AS deps-front

ENV LOCALTIME Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$LOCALTIME /etc/localtime && echo $LOCALTIME > /etc/timezone

RUN set -ex && \
    mkdir -p /app && \
    chown -R node:node /app && \
    chown node:node /app

WORKDIR /app

USER node

COPY --chown=node:node app/. /app/

RUN npm ci

FROM node:20.12 AS build-front

ENV LOCALTIME Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$LOCALTIME /etc/localtime && echo $LOCALTIME > /etc/timezone

# LOCAL | WORK | RC | PROD
ARG NEXT_PUBLIC_APP_ENV
# публичный урл front приложения
ARG NEXT_PUBLIC_FRONT_URL
# публичный урл back приложения (опционален)
ARG NEXT_PUBLIC_BACK_URL
# DSN для доступа к Sentry
ARG NEXT_PUBLIC_SENTRY_DSN

RUN set -ex && \
    mkdir -p /app && \
    chown -R node:node /app && \
    chown node:node /app

WORKDIR /app

COPY .docker/docker-entrypoint.sh /entrypoint.sh

COPY --from=deps-front --chown=node:node /app/. /app/

USER node

RUN npm run build

ENTRYPOINT ["/entrypoint.sh"]
