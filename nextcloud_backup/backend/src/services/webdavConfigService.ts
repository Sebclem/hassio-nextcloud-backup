import fs from "fs";
import Joi from "joi";
import logger from "../config/winston.js";
import { default_root } from "../tools/pathTools.js";
import {
  type WebdavConfig,
  WebdavEndpointType
} from "../types/services/webdavConfig.js";
import WebdavConfigValidation from "../types/services/webdavConfigValidation.js";

const webdavConfigPath = "/data/webdavConfigV2.json";
const NEXTCLOUD_ENDPOINT = "/remote.php/dav/files/$username";

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
  if (endpoint.endsWith("/")) {
    return endpoint.slice(0, -1);
  }
  return endpoint;
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
