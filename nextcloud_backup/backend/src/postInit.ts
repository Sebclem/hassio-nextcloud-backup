import { existsSync, mkdirSync } from "fs";
import logger from "./config/winston.js";
import * as homeAssistantService from "./services/homeAssistantService.js";
import * as settingsTools from "./tools/settingsTools.js";
import * as statusTools from "./tools/status.js";
import kleur from "kleur";
import { checkWebdavLogin, createBackupFolder } from "./services/webdavService.js";
import {
  getWebdavConfig,
  validateWebdavConfig,
} from "./services/webdavConfigService.js";
import messageManager from "./tools/messageManager.js";

function postInit() {
  logger.info(`Log level: ${process.env.LOG_LEVEL}`);

  logger.info(
    `Backup timeout: ${
      (process.env.CREATE_BACKUP_TIMEOUT
        ? parseInt(process.env.CREATE_BACKUP_TIMEOUT)
        : false) || 90 * 60 * 1000
    }`
  );

  if (!existsSync("/data")) mkdirSync("/data");
  statusTools.init();
  logger.info("Satus : " + kleur.green().bold("Go !"));

  homeAssistantService.getBackups().then(
    () => {
      logger.info("Hassio API : " + kleur.green().bold("Go !"));
    },
    (err) => {
      logger.error("Hassio API : " + kleur.red().bold("FAIL !"));
      logger.error("... " + err);
    }
  );

  const webdavConf = getWebdavConfig();
  validateWebdavConfig(webdavConf).then(
    () => {
      logger.info("Webdav config: " + kleur.green().bold("Go !"));
      checkWebdavLogin(webdavConf).then(
        () => {
          logger.info("Webdav : " + kleur.green().bold("Go !"));
          createBackupFolder(webdavConf).then(
            () => {
              logger.info("Webdav fodlers: " + kleur.green().bold("Go !"));
            },
            (reason) => {
              logger.error("Webdav folders: " + kleur.red().bold("FAIL !"));
              logger.error(reason);
            }
          );
        },
        (reason) => {
          logger.error("Webdav : " + kleur.red().bold("FAIL !"));
          logger.error(reason);
        }
      );
    },
    (reason) => {
      logger.error("Webdav config: " + kleur.red().bold("FAIL !"));
      logger.error(reason);
      messageManager.error("Invalid webdav config", reason.message);
    }
  );

  settingsTools.check(settingsTools.getSettings(), true);
  // cronTools.init();
  
}

export default postInit;
