import fs from "fs";
import Joi from "joi"
import logger from "../config/winston.js";
import type { BackupConfig } from "../types/services/backupConfig.js"
import backupConfigValidation from "../types/services/backupConfigValidation.js";


const backupConfigPath = "/data/backupConfigV2.json";


export function validateBackupConfig(config: BackupConfig){
  const validator = Joi.object(backupConfigValidation);
  return validator.validateAsync(config, {
    abortEarly: false
  });
}

export function saveBackupConfig(config: BackupConfig){
  fs.writeFileSync(backupConfigPath, JSON.stringify(config, undefined, 2));
}

export function getBackupConfig(): BackupConfig {
  if (!fs.existsSync(backupConfigPath)) {
    logger.warn("Config file not found, creating default one !")
    const defaultConfig = getBackupDefaultConfig();
    saveBackupConfig(defaultConfig);
    return defaultConfig;
  } else {
    return JSON.parse(fs.readFileSync(backupConfigPath).toString());
  }
}

export function getBackupDefaultConfig(): BackupConfig {
  return {
    nameTemplate: "{type}-{ha_version}-{date}_{hour}",
    cron: [],
    autoClean: {
      homeAssistant: {
        enabled: false,
      },
      webdav: {
        enabled: false
      },
    },
    exclude: {
      addon: [],
      folder: [],
    },
    autoStopAddon: [],
    password: {
      enabled: false,
    }
  }
}