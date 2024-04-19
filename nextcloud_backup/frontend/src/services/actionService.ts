import kyClient from "./kyClient";

export function backupNow() {
  return kyClient.post("action/backup");
}
