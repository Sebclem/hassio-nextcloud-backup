ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.20

FROM node:22 AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install

COPY frontend/ .

RUN pnpm build

FROM node:22 AS backend-builder

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install

COPY backend/ .

RUN pnpm build

FROM $BUILD_FROM

COPY rootfs/etc /etc/
COPY rootfs/usr /usr/

RUN apk add --no-cache nodejs-current && mkdir -p /usr/local/sbin/ && ln -s /usr/bin/node /usr/local/sbin/node

WORKDIR /opt/nextcloud_backup/

COPY backend/package.json backend/pnpm-lock.yaml ./

COPY --from=backend-builder /app/dist .
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/dist ./public
