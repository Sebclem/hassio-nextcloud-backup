ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.18

FROM node:20 AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable
RUN pnpm install

COPY frontend/ .

RUN pnpm build

FROM node:20 AS backend-builder

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN corepack enable
RUN pnpm install

COPY backend/ .

RUN pnpm build

FROM $BUILD_FROM

# Copy root filesystem
COPY rootfs/etc /etc/
COPY rootfs/usr /usr/

# Setup base
RUN apk add --no-cache nodejs-current

# Fix for arm/v7
RUN mkdir -p  /usr/local/sbin/
RUN ln -s /usr/bin/node /usr/local/sbin/node


WORKDIR /opt/nextcloud_backup/

COPY backend/package.json backend/pnpm-lock.yaml ./

COPY --from=backend-builder /app/dist .
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/dist ./public
