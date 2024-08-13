#!/usr/bin/with-contenv bashio
# ==============================================================================
#
# Community Hass.io Add-ons: Example
#
# Example add-on for Hass.io.
# This add-on displays a random quote every X seconds.
#
# ==============================================================================

cd /opt/nextcloud_backup/
if bashio::config.exists 'log_level'; then
  LOG_LEVEL=$(bashio::config 'log_level')
else
  LOG_LEVEL='info'
fi

if bashio::config.exists 'create_backup_timeout'; then
  CREATE_BACKUP_TIMEOUT=$(bashio::config 'create_backup_timeout')
else
  CREATE_BACKUP_TIMEOUT='info'
fi

LOG_LEVEL=$LOG_LEVEL CREATE_BACKUP_TIMEOUT=$CREATE_BACKUP_TIMEOUT node server.js