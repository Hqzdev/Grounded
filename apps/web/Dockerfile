FROM node:20-slim

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
