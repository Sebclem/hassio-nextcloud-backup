import type {
  BackupDetailModel,
  AddonData,
  BackupModel,
  Folder,
} from "@/types/homeAssistant";
import kyClient from "./kyClient";

export function getFolders() {
  return kyClient.get("homeAssistant/folders").json<Folder[]>();
}

export function getAddons() {
  return kyClient.get("homeAssistant/addons").json<AddonData>();
}

export function getBackups() {
  return kyClient.get("homeAssistant/backups").json<BackupModel[]>();
}

export function getBackupDetail(slug: string) {
  return kyClient.get(`homeAssistant/backup/${slug}`).json<BackupDetailModel>();
}

export function uploadHomeAssistantBackup(slug: string) {
  return kyClient.post(`homeAssistant/backup/${slug}/upload`);
}

export function deleteHomeAssistantBackup(slug: string) {
  return kyClient.delete(`homeAssistant/backup/${slug}`);
}
