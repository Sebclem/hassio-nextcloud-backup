import type { BackupConfig } from "@/types/backupConfig";
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
      json: config,
    })
    .json();
}
