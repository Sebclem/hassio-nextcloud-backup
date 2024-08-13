import { existsSync, mkdirSync } from "fs";
import logger from "./config/winston.js";
import * as homeAssistantService from "./services/homeAssistantService.js";
import * as statusTools from "./tools/status.js";
import kleur from "kleur";
import {
  checkWebdavLogin,
  createBackupFolder,
} from "./services/webdavService.js";
import {
  getWebdavConfig,
  validateWebdavConfig,
} from "./services/webdavConfigService.js";
import messageManager from "./tools/messageManager.js";
import { initCron } from "./services/cronService.js";
import { getBackupConfig } from "./services/backupConfigService.js";

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
  validateWebdavConfig(webdavConf)
    .then(
      () => {
        logger.info("Webdav config: " + kleur.green().bold("Go !"));
        return checkWebdavLogin(webdavConf);
      },
      (reason: Error) => {
        logger.error("Webdav config: " + kleur.red().bold("FAIL !"));
        logger.error(reason);
        messageManager.error("Invalid webdav config", reason.message);
      }
    )
    .then(
      () => {
        logger.info("Webdav : " + kleur.green().bold("Go !"));
        return createBackupFolder(webdavConf);
      },
      (reason) => {
        logger.error("Webdav : " + kleur.red().bold("FAIL !"));
        logger.error(reason);
      }
    )
    .then(
      () => {
        logger.info("Webdav fodlers: " + kleur.green().bold("Go !"));
        return initCron(getBackupConfig());
      },
      (reason) => {
        logger.error("Webdav folders: " + kleur.red().bold("FAIL !"));
        logger.error(reason);
      }
    )
    .then(
      () => {
        logger.info("Cron: " + kleur.green().bold("Go !"));
      },
      () => {
        logger.info("Cron: " + kleur.red().bold("FAIL !"));
      }
    );
}

export default postInit;
