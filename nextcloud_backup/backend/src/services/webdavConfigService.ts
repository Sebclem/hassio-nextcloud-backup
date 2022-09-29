import fs from "fs";
import Joi from "joi"
import logger from "../config/winston.js";
import { default_root } from "../tools/pathTools.js";
import WebdavConfigValidation from "../types/services/webdavConfigValidation.js";
import { WebdavConfig, WebdavEndpointType } from "../types/services/webdavConfig.js"


const webdavConfigPath = "/data/webdavConfigV2.json";


export function validateWebdavConfig(config: WebdavConfig){
  const validator = Joi.object(WebdavConfigValidation);
  return validator.validateAsync(config);
}

export function saveWebdavConfig(config: WebdavConfig){
  fs.writeFileSync(webdavConfigPath, JSON.stringify(config, undefined, 2));
}

export function getWebdavConfig(): WebdavConfig {
  if (!fs.existsSync(webdavConfigPath)) {
    logger.warn("Webdav Config file not found, creating default one !")
    const defaultConfig = getWebdavDefaultConfig();
    saveWebdavConfig(defaultConfig);
    return defaultConfig;
  } else {
    return JSON.parse(fs.readFileSync(webdavConfigPath).toString());
  }
}

export function getWebdavDefaultConfig(): WebdavConfig {
  return {
    url: "",
    username: "",
    password: "",
    backupDir: default_root,
    allowSelfSignedCerts: false,
    webdavEndpoint: {
      type: WebdavEndpointType.NEXTCLOUD,
    }
  }
}