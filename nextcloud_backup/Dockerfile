ARG BUILD_FROM=ghcr.io/hassio-addons/base/amd64:16.2.1
FROM ${BUILD_FROM}

# Copy root filesystem
COPY rootfs/etc /etc/
COPY rootfs/usr /usr/

# Setup base
RUN apk add --no-cache nodejs-current

# Fix for arm/v7
RUN mkdir -p  /usr/local/sbin/
RUN ln -s /usr/bin/node /usr/local/sbin/node

# Copy only package*.json
COPY rootfs/opt/nextcloud_backup/package*.json /opt/nextcloud_backup/
COPY rootfs/opt/nextcloud_backup/.yarnrc.yml /opt/nextcloud_backup/
COPY rootfs/opt/nextcloud_backup/.yarn/releases/* /opt/nextcloud_backup/.yarn/releases/

WORKDIR /opt/nextcloud_backup/

# Enable Yarn
RUN corepack enable

# Install packages
RUN yarn install

# Copy all source code
COPY rootfs/opt/ /opt/

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
