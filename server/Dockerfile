FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

EXPOSE 3000

CMD ["sh", "-c", "node migrations/runMigrations.js && node server.js"]
