import fs from "fs";
import Joi from "joi";
import logger from "../config/winston.js";
import type { BackupConfig } from "../types/services/backupConfig.js";
import backupConfigValidation from "../types/services/backupConfigValidation.js";

const backupConfigPath = "/data/backupConfigV2.json";

export function validateBackupConfig(config: BackupConfig) {
  const validator = Joi.object(backupConfigValidation);
  return validator.validateAsync(config, {
    abortEarly: false,
  });
}

export function saveBackupConfig(config: BackupConfig) {
  fs.writeFileSync(backupConfigPath, JSON.stringify(config, undefined, 2));
}

export function getBackupConfig(): BackupConfig {
  if (!fs.existsSync(backupConfigPath)) {
    logger.warn("Config file not found, creating default one !");
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
        enabled: false,
      },
    },
    exclude: {
      addon: [],
      folder: [],
    },
    autoStopAddon: [],
    password: {
      enabled: false,
    },
  };
}

export function templateToRegexp(template: string) {
  let regexp = template.replace("{date}", "(?<date>\\d{4}-\\d{2}-\\d{2})");
  regexp = regexp.replace("{hour}", "(?<hour>\\d{4})");
  regexp = regexp.replace("{hour_12}", "(?<hour12>\\d{4}(AM|PM))");
  regexp = regexp.replace("{type}", "(?<type>Auto|Manual|)")
  regexp = regexp.replace("{type_low}", "(?<type>auto|manual|)")
  return regexp.replace(
    "{ha_version}",
    "(?<version>\\d+\\.\\d+\\.\\d+(b\\d+)?)"
  );
}
