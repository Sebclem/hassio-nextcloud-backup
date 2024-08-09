import fs from "fs";
import Joi from "joi";
import logger from "../config/winston.js";
import {
  type BackupConfig,
  BackupType,
} from "../types/services/backupConfig.js";
import backupConfigValidation from "../types/services/backupConfigValidation.js";
import { DateTime } from "luxon";
import { WorkflowType } from "../types/services/orchecstrator.js";
import { initCron } from "./cronService.js";

const backupConfigPath = "/data/backupConfigV2.json";

export function validateBackupConfig(config: BackupConfig) {
  const validator = Joi.object(backupConfigValidation);
  return validator.validateAsync(config, {
    abortEarly: false,
  });
}

export function saveBackupConfig(config: BackupConfig) {
  fs.writeFileSync(backupConfigPath, JSON.stringify(config, undefined, 2));
  return initCron(config);
}

export function getBackupConfig(): BackupConfig {
  if (!fs.existsSync(backupConfigPath)) {
    logger.warn("Config file not found, creating default one !");
    const defaultConfig = getBackupDefaultConfig();
    saveBackupConfig(defaultConfig).catch(() => {});
    return defaultConfig;
  } else {
    return JSON.parse(
      fs.readFileSync(backupConfigPath).toString()
    ) as BackupConfig;
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
    backupType: BackupType.FULL,
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
  regexp = regexp.replace("{type}", "(?<type>Auto|Manual|)");
  regexp = regexp.replace("{type_low}", "(?<type>auto|manual|)");
  return regexp.replace(
    "{ha_version}",
    "(?<version>\\d+\\.\\d+\\.\\d+(b\\d+)?)"
  );
}

export function getFormatedName(
  workflowType: WorkflowType,
  ha_version: string
) {
  const setting = getBackupConfig();
  let template = setting.nameTemplate;
  template = template.replace(
    "{type_low}",
    workflowType == WorkflowType.MANUAL ? "manual" : "auto"
  );
  template = template.replace(
    "{type}",
    workflowType == WorkflowType.MANUAL ? "Manual" : "Auto"
  );
  template = template.replace("{ha_version}", ha_version);
  const now = DateTime.now().setLocale("en");
  template = template.replace("{hour_12}", now.toFormat("hhmma"));
  template = template.replace("{hour}", now.toFormat("HHmm"));
  template = template.replace("{date}", now.toFormat("yyyy-MM-dd"));
  return template;
}
