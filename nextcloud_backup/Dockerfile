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

FROM ghcr.io/hassio-addons/base/amd64:16.2.1

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
RUN corepack enable
RUN pnpm install

# Copy all source code

COPY --from=backend-builder /app/dist .
COPY --from=frontend-builder /app/dist ./public

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_REF
ARG BUILD_VERSION
ARG IMAGE_SOURCE

# Labels
LABEL \
    io.hass.name="Nextcloud Backup" \
    io.hass.description="Addon that backup your snapshot to a Nextcloud server" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Sebclem" \
    org.label-schema.description="Addon that backup your snapshot to a Nextcloud server" \
    org.label-schema.build-date=${BUILD_DATE} \
    org.label-schema.name="Nextcloud Backup" \
    org.label-schema.schema-version="1.0" \
    org.label-schema.url="https://addons.community" \
    org.label-schema.usage="https://github.com/Sebclem/hassio-nextcloud-backup/tree/master/README.md" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-url="https://github.com/Sebclem/hassio-nextcloud-backup" \
    org.label-schema.vendor="Sebclem"\
    org.opencontainers.image.source=${IMAGE_SOURCE}
