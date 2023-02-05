import { getBackupConfig } from "@/services/configService";
import { getAddons, getFolders } from "@/services/homeAssistantService";
import { BackupType, CronMode, type BackupConfig } from "@/types/backupConfig";
import type { Folder, AddonModel } from "@/types/homeAssistant";
import { defineStore } from "pinia";
import { ref } from "vue";
import { v4 as uuidv4 } from "uuid";

export const useBackupConfigStore = defineStore("backupConfig", () => {
  const data = ref<BackupConfig>({} as BackupConfig);
  const addons = ref<AddonModel[]>([]);
  const folders = ref<Folder[]>([]);

  // This represent the oposite of excluded => if prensent on this list, backup it
  const invertedFolders = ref<string[]>([]);
  const invertedAddons = ref<string[]>([]);

  function loadAll() {
    const conf = getBackupConfig();
    const foldersProm = getFolders();
    const addonsProm = getAddons();
    return Promise.all([conf, foldersProm, addonsProm]).then((value) => {
      if (value[0].backupType == BackupType.Partial && value[0].exclude) {
        for (const folder of value[1]) {
          if (!value[0].exclude.folder.includes(folder.slug)) {
            invertedFolders.value.push(folder.slug);
          }
        }
        for (const addon of value[2].addons) {
          if (!value[0].exclude.addon.includes(addon.slug)) {
            invertedAddons.value.push(addon.slug);
          }
        }
      }

      data.value = value[0];
      folders.value = value[1];
      addons.value = value[2].addons;
    });
  }

  function addEmptyCron() {
    data.value.cron.push({
      id: uuidv4(),
      mode: CronMode.Daily,
    });
  }

  function initExcludes() {
    data.value.exclude = { addon: [], folder: [] };
    addons.value.forEach((value) => {
      invertedAddons.value.push(value.slug);
    });
    folders.value.forEach((value) => {
      invertedFolders.value.push(value.slug);
    });
  }

  function removeCron(id: string) {
    data.value.cron = data.value.cron.filter((value) => value.id != id);
  }

  return {
    data,
    addons,
    folders,
    invertedFolders,
    invertedAddons,
    loadAll,
    addEmptyCron,
    removeCron,
    initExcludes,
  };
});
