import type { AddonData, Folder } from "@/types/homeAssistant";
import kyClient from "./kyClient";

export function getFolders() {
  return kyClient.get("homeAssistant/folders").json<Folder[]>();
}

export function getAddons() {
  return kyClient.get("homeAssistant/addons").json<AddonData>();
}
