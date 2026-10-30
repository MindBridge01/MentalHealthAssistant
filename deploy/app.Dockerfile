# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY client ./client
COPY assets ./assets
COPY public ./public
COPY chatbot/src ./chatbot/src
RUN npm run build

FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY chatbot/package.json chatbot/package-lock.json ./chatbot/
RUN npm ci --prefix server --omit=dev && npm ci --prefix chatbot --omit=dev

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates clamav clamav-freshclam tini \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/lib/clamav /app/server/uploads \
    && sed -i '/^UpdateLogFile /d; /^DatabaseOwner /d; /^PidFile /d; /^NotifyClamd /d' /etc/clamav/freshclam.conf \
    && chown -R node:node /var/lib/clamav /app
WORKDIR /app
ARG RELEASE_SHA=unknown
ENV APP_RELEASE_SHA=${RELEASE_SHA}
LABEL org.opencontainers.image.revision=${RELEASE_SHA}
ENV NODE_ENV=production PORT=10000 \
    FRONTEND_AUTOSTART=false CHATBOT_AUTOSTART=false CHATBOT_MODELS_AUTOSTART=false
COPY --chown=node:node --from=dependencies /app/server/node_modules ./server/node_modules
COPY --chown=node:node --from=dependencies /app/chatbot/node_modules ./chatbot/node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node server ./server
COPY --chown=node:node chatbot ./chatbot
COPY --chown=node:node deploy ./deploy
COPY --chown=node:node --from=frontend /app/dist ./dist
USER node
EXPOSE 10000
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "node", "deploy/start.cjs"]
CMD ["node", "server/server.js"]
