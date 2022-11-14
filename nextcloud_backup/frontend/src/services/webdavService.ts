import type { WebdavBackup } from "@/types/webdav";
import kyClient from "./kyClient";

export function getAutoBackupList() {
  return kyClient.get("webdav/backup/auto").json<WebdavBackup[]>();
}

export function getManualBackupList() {
  return kyClient.get("webdav/backup/manual").json<WebdavBackup[]>();
}

export function deleteWebdabBackup(path: string) {
  return kyClient
    .delete("webdav", {
      json: {
        path: path,
      },
    })
    .text();
}
