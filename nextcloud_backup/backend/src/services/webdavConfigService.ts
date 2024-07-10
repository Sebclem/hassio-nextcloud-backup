import fs from "fs";
import Joi from "joi";
import logger from "../config/winston.js";
import { default_root } from "../tools/pathTools.js";
import {
  type WebdavConfig,
  WebdavEndpointType,
} from "../types/services/webdavConfig.js";
import WebdavConfigValidation from "../types/services/webdavConfigValidation.js";
import { BackupType } from "../types/services/backupConfig.js";
import * as pathTools from "../tools/pathTools.js";
import { WorkflowType } from "../types/services/orchecstrator.js";
import e from "express";

const webdavConfigPath = "/data/webdavConfigV2.json";
const NEXTCLOUD_ENDPOINT = "/remote.php/dav/files/$username";
const NEXTCLOUD_CHUNK_ENDPOINT = "/remote.php/dav/uploads/$username";

export function validateWebdavConfig(config: WebdavConfig) {
  const validator = Joi.object(WebdavConfigValidation);
  return validator.validateAsync(config, {
    abortEarly: false,
  });
}

export function saveWebdavConfig(config: WebdavConfig) {
  fs.writeFileSync(webdavConfigPath, JSON.stringify(config, undefined, 2));
}

export function getWebdavConfig(): WebdavConfig {
  if (!fs.existsSync(webdavConfigPath)) {
    logger.warn("Webdav Config file not found, creating default one !");
    const defaultConfig = getWebdavDefaultConfig();
    saveWebdavConfig(defaultConfig);
    return defaultConfig;
  } else {
    return JSON.parse(fs.readFileSync(webdavConfigPath).toString());
  }
}

export function getEndpoint(config: WebdavConfig) {
  let endpoint: string;

  if (config.webdavEndpoint.type == WebdavEndpointType.NEXTCLOUD) {
    endpoint = NEXTCLOUD_ENDPOINT.replace("$username", config.username);
  } else if (config.webdavEndpoint.customEndpoint) {
    endpoint = config.webdavEndpoint.customEndpoint.replace(
      "$username",
      config.username
    );
  } else {
    return "";
  }
  if (!endpoint.startsWith("/")) {
    endpoint = "/" + endpoint;
  }

  if (!endpoint.endsWith("/")) {
    return endpoint + "/";
  }

  return endpoint;
}

export function getChunkEndpoint(config: WebdavConfig) {
  let endpoint: string;

  if (config.webdavEndpoint.type == WebdavEndpointType.NEXTCLOUD) {
    endpoint = NEXTCLOUD_CHUNK_ENDPOINT.replace("$username", config.username);
  } else if (config.webdavEndpoint.customChunkEndpoint) {
    endpoint = config.webdavEndpoint.customChunkEndpoint.replace(
      "$username",
      config.username
    );
  } else {
    return "";
  }
  if (!endpoint.startsWith("/")) {
    endpoint = "/" + endpoint;
  }

  if (!endpoint.endsWith("/")) {
    return endpoint + "/";
  }

  return endpoint;
}

export function getBackupFolder(type: WorkflowType, config: WebdavConfig) {
  const end = type == WorkflowType.AUTO ? pathTools.auto : pathTools.manual;
  return config.backupDir.endsWith("/")
    ? config.backupDir + end
    : config.backupDir + "/" + end;
}

export function getWebdavDefaultConfig(): WebdavConfig {
  return {
    url: "",
    username: "",
    password: "",
    backupDir: default_root,
    allowSelfSignedCerts: false,
    chunckedUpload: false,
    webdavEndpoint: {
      type: WebdavEndpointType.NEXTCLOUD,
    },
  };
}
