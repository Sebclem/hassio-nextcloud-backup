import { existsSync, unlinkSync } from "fs";
import { DateTime } from "luxon";
import logger from "../config/winston.js";
import messageManager from "../tools/messageManager.js";
import * as statusTools from "../tools/status.js";
import { BackupType } from "../types/services/backupConfig.js";
import type {
  AddonModel,
  BackupDetailModel,
  BackupUpload,
  SupervisorResponse,
} from "../types/services/ha_os_response.js";
import { WorkflowType } from "../types/services/orchecstrator.js";
import * as backupConfigService from "./backupConfigService.js";
import * as homeAssistantService from "./homeAssistantService.js";
import { getBackupFolder, getWebdavConfig } from "./webdavConfigService.js";
import * as webDavService from "./webdavService.js";
import { getNextDate } from "./cronService.js";

export function doBackupWorkflow(type: WorkflowType) {
  let name = "";
  let addonsToStartStop = [] as string[];
  let addonInHa = [] as AddonModel[];
  let tmpBackupFile = "";

  const backupConfig = backupConfigService.getBackupConfig();
  const webdavConfig = getWebdavConfig();

  logger.info(`Stating backup workflow, type: ${type}`);

  return homeAssistantService
    .getVersion()
    .then((value) => {
      const version = value.body.data.version;
      name = backupConfigService.getFormatedName(type, version);
      return homeAssistantService.getAddonList();
    })
    .then((response) => {
      addonInHa = response.body.data.addons;
      addonsToStartStop = sanitizeAddonList(
        backupConfig.autoStopAddon,
        response.body.data.addons
      );
      return webDavService.checkWebdavLogin(webdavConfig);
    })
    .then(() => {
      if (!statusTools.getStatus().webdav.folder_created) {
        return webDavService.createBackupFolder(webdavConfig);
      } else {
        return Promise.resolve();
      }
    })
    .then(() => {
      return homeAssistantService.stopAddons(addonsToStartStop);
    })
    .then(() => {
      if (backupConfig.backupType == BackupType.FULL) {
        return homeAssistantService.createNewBackup(
          name,
          backupConfig.backupType,
          backupConfig.password.enabled,
          backupConfig.password.value
        );
      } else {
        const addons = getAddonToBackup(
          backupConfig.exclude?.addon as string[],
          addonInHa
        );
        const folders = getFolderToBackup(
          backupConfig.exclude?.folder as string[],
          homeAssistantService.getFolderList()
        );
        return homeAssistantService.createNewBackup(
          name,
          backupConfig.backupType,
          backupConfig.password.enabled,
          backupConfig.password.value,
          addons,
          folders
        );
      }
    })
    .then((response) => {
      return homeAssistantService.downloadSnapshot(response.body.data.slug);
    })
    .then((tmpFile) => {
      tmpBackupFile = tmpFile;
      if (webdavConfig.chunckedUpload) {
        return webDavService.chunkedUpload(
          tmpFile,
          getBackupFolder(type, webdavConfig) + name + ".tar",
          webdavConfig
        );
      } else {
        return webDavService.webdavUploadFile(
          tmpFile,
          getBackupFolder(type, webdavConfig) + name + ".tar",
          webdavConfig
        );
      }
    })
    .then(() => {
      return homeAssistantService.startAddons(addonsToStartStop);
    })
    .then(() => {
      return homeAssistantService.clean(backupConfig);
    })
    .then(() => {
      return webDavService.clean(backupConfig, webdavConfig);
    })
    .then(() => {
      logger.info("Backup workflow finished successfully !");
      messageManager.info(
        "Backup workflow finished successfully !",
        `name: ${name}`
      );
      const status = statusTools.getStatus();
      status.last_backup.success = true;
      status.last_backup.last_try = DateTime.now();
      status.last_backup.last_success = DateTime.now();
      status.next_backup = getNextDate();
      statusTools.setStatus(status);
    })
    .catch(() => {
      backupFail();
      if (tmpBackupFile != "" && existsSync(tmpBackupFile)) {
        unlinkSync(tmpBackupFile);
      }
      homeAssistantService.startAddons(addonsToStartStop).catch(() => {});
    });
}

export function uploadToCloud(slug: string) {
  const webdavConfig = getWebdavConfig();
  let tmpBackupFile = "";
  let backupInfo = {} as BackupDetailModel;

  return webDavService
    .checkWebdavLogin(webdavConfig)
    .then(() => {
      if (!statusTools.getStatus().webdav.folder_created) {
        return webDavService.createBackupFolder(webdavConfig);
      } else {
        return Promise.resolve();
      }
    })
    .then(() => {
      return homeAssistantService.getBackupInfo(slug);
    })
    .then((response) => {
      backupInfo = response.body.data;
      return homeAssistantService.downloadSnapshot(slug);
    })
    .then((tmpFile) => {
      tmpBackupFile = tmpFile;
      if (webdavConfig.chunckedUpload) {
        return webDavService.chunkedUpload(
          tmpFile,
          getBackupFolder(WorkflowType.MANUAL, webdavConfig) +
            backupInfo.name +
            ".tar",
          webdavConfig
        );
      } else {
        return webDavService.webdavUploadFile(
          tmpFile,
          getBackupFolder(WorkflowType.MANUAL, webdavConfig) +
            backupInfo.name +
            ".tar",
          webdavConfig
        );
      }
    })
    .then(() => {
      logger.info(`Successfully uploaded ${backupInfo.name} to cloud.`);
      messageManager.info(
        "Successfully uploaded backup to cloud.",
        `Name: ${backupInfo.name}`
      );
    })
    .catch(() => {
      if (tmpBackupFile != "") {
        unlinkSync(tmpBackupFile);
      }
      return Promise.reject(new Error());
    });
}

// This methods remove addon that are no installed in HA from the conf array
function sanitizeAddonList(addonInConf: string[], addonInHA: AddonModel[]) {
  return addonInConf.filter((value) => addonInHA.some((v) => v.slug == value));
}

function getAddonToBackup(excludedAddon: string[], addonInHA: AddonModel[]) {
  const slugs: string[] = [];
  for (const addon of addonInHA) {
    if (!excludedAddon.includes(addon.slug)) slugs.push(addon.slug);
  }
  logger.debug("Addon to backup:");
  logger.debug(slugs);
  return slugs;
}

function getFolderToBackup(
  excludedFolder: string[],
  folderInHA: { name: string; slug: string }[]
) {
  const slugs = [];
  for (const folder of folderInHA) {
    if (!excludedFolder.includes(folder.slug)) slugs.push(folder.slug);
  }
  logger.debug("Folders to backup:");
  logger.debug(slugs);
  return slugs;
}

function backupFail() {
  const status = statusTools.getStatus();
  status.last_backup.success = false;
  status.last_backup.last_try = DateTime.now();
  status.next_backup = getNextDate();
  statusTools.setStatus(status);
  messageManager.error("Last backup as failed !");
}

export function restoreToHA(webdavPath: string, filename: string) {
  const webdavConfig = getWebdavConfig();
  return webDavService
    .checkWebdavLogin(webdavConfig)
    .then(() => {
      if (!statusTools.getStatus().webdav.folder_created) {
        return webDavService.createBackupFolder(webdavConfig);
      } else {
        return Promise.resolve();
      }
    })
    .then(() => {
      return webDavService.downloadFile(webdavPath, filename, webdavConfig);
    })
    .then((tmpFile) => {
      return homeAssistantService.uploadSnapshot(tmpFile);
    })
    .then((res) => {
      if (res) {
        const body = JSON.parse(res.body) as SupervisorResponse<BackupUpload>;
        logger.info(`Successfully uploaded ${filename} to Home Assistant.`);
        messageManager.info(
          "Successfully uploaded backup to Home Assistant.",
          `Name: ${filename} slug: ${body.data.slug}
          `
        );
      }
    });
}
