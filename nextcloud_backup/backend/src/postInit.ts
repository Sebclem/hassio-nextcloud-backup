import { existsSync, mkdirSync } from "fs";
import logger from "./config/winston.js";
import * as homeAssistantService from "./services/homeAssistantService.js";
import * as settingsTools from "./tools/settingsTools.js";
import * as statusTools from "./tools/status.js";
import kleur from 'kleur';


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

  // webdav.confIsValid().then(
  //     () => {
  //         newlog.info("Nextcloud connection : \x1b[32mGo !\x1b[0m");
  //     },
  //     (err) => {
  //         newlog.error("Nextcloud connection : \x1b[31;1mFAIL !\x1b[0m");
  //         newlog.error("... " + err);
  //     }
  // );

  settingsTools.check(settingsTools.getSettings(), true);
  // cronTools.init();
}

export default postInit;
