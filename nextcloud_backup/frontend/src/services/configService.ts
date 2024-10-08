import { BackupType, type BackupConfig } from "@/types/backupConfig";
import type { WebdavConfig } from "@/types/webdavConfig";
import kyClient from "./kyClient";

export function getWebdavConfig() {
  return kyClient.get("config/webdav").json<WebdavConfig>();
}

export function saveWebdavConfig(config: WebdavConfig) {
  return kyClient
    .put("config/webdav", {
      json: config,
    })
    .json();
}

export function getBackupConfig() {
  return kyClient.get("config/backup").json<BackupConfig>();
}

export function saveBackupConfig(config: BackupConfig) {
  return kyClient
    .put("config/backup", {
      json: cleanupConfig(config),
    })
    .json();
}

function cleanupConfig(config: BackupConfig) {
  if (config.backupType == BackupType.Full) {
    config.exclude = undefined;
  } else if (!config.exclude) {
    config.exclude = { addon: [], folder: [] };
  }

  if (!config.autoClean.homeAssistant.enabled) {
    config.autoClean.homeAssistant.nbrToKeep = undefined;
  }
  if (!config.autoClean.webdav.enabled) {
    config.autoClean.webdav.nbrToKeep = undefined;
  }

  if (!config.password.enabled) {
    config.password.value = undefined;
  }
  return config;
}
