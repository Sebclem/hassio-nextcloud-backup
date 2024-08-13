import kyClient from "./kyClient";

export function backupNow() {
  return kyClient.post("action/backup");
}

export function clean() {
  return kyClient.post("action/clean");
}