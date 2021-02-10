ARG BUILD_FROM=hassioaddons/base:8.0.1
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Copy root filesystem
COPY rootfs /

# Setup base
RUN apk add --no-cache \
    nodejs \
    npm

WORKDIR /opt/nextcloud_backup

RUN npm install

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
    org.label-schema.usage="https://github.com/hassio-addons/addon-example/tree/master/README.md" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-url="https://github.com/hassio-addons/addon-example" \
    org.label-schema.vendor="Sebclem"\
    org.opencontainers.image.source=${IMAGE_SOURCE}
