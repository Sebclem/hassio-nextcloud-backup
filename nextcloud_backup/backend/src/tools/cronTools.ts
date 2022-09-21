import { CronJob } from "cron";
import * as settingsTools from "./settingsTools.js";
import * as hassioApiTools from "./hassioApiTools.js";
import * as statusTools from "./status.js";
import * as pathTools from "./pathTools.js";
import webdav from "./webdavTools.js";

import logger from "../config/winston.js";

class CronContainer {
  cronJob: CronJob | undefined;
  cronClean: CronJob | undefined;

  init() {
    const settings = settingsTools.getSettings();
    let cronStr = "";
    if (!this.cronClean) {
      logger.info("Starting auto clean cron...");
      this.cronClean = new CronJob(
        "0 1 * * *",
        this._clean,
        null,
        false,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      this.cronClean.start();
    }
    if (this.cronJob) {
      logger.info("Stopping Cron...");
      this.cronJob.stop();
      this.cronJob = undefined;
    }
    if (!settingsTools.check_cron(settingsTools.getSettings())) {
      logger.warn("No Cron settings available.");
      return;
    }

    switch (settings.cron_base) {
      case "0":
        logger.warn("No Cron settings available.");
        return;
      case "1": {
        const splited = settings.cron_hour.split(":");
        cronStr = "" + splited[1] + " " + splited[0] + " * * *";
        break;
      }

      case "2": {
        const splited = settings.cron_hour.split(":");
        cronStr =
          "" + splited[1] + " " + splited[0] + " * * " + settings.cron_weekday;
        break;
      }

      case "3": {
        const splited = settings.cron_hour.split(":");
        cronStr =
          "" +
          splited[1] +
          " " +
          splited[0] +
          " " +
          settings.cron_month_day +
          " * *";
        break;
      }
      case "4": {
        cronStr = settings.cron_custom;
        break;
      }
    }
    logger.info("Starting Cron...");
    this.cronJob = new CronJob(
      cronStr,
      this._createBackup,
      null,
      false,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    this.cronJob.start();
    this.updateNextDate();
  }

  updateNextDate() {
    let date;
    if (this.cronJob) {
      date = this.cronJob
        .nextDate()
        .setLocale("en")
        .toFormat("dd MMM yyyy, HH:mm");
    }
    const status = statusTools.getStatus();
    status.next_backup = date;
    statusTools.setStatus(status);
  }

  _createBackup() {
    logger.debug("Cron triggered !");
    const status = statusTools.getStatus();
    if (
      status.status === "creating" ||
      status.status === "upload" ||
      status.status === "download" ||
      status.status === "stopping" ||
      status.status === "starting"
    )
      return;
    hassioApiTools
      .stopAddons()
      .then(() => {
        hassioApiTools.getVersion().then((version) => {
          const name = settingsTools.getFormatedName(false, version);
          hassioApiTools.createNewBackup(name).then((id) => {
            hassioApiTools.downloadSnapshot(id).then(() => {
              webdav
                .uploadFile(
                  id,
                  webdav.getConf()?.back_dir + pathTools.auto + name + ".tar"
                )
                .then(() => {
                  hassioApiTools.startAddons().catch(() => {
                    // Skip
                  });
                });
            });
          });
        });
      })
      .catch(() => {
        hassioApiTools.startAddons().catch(() => {
          // Skip
        });
      });
  }

  _clean() {
    const autoCleanlocal = settingsTools.getSettings().auto_clean_local;
    if (autoCleanlocal && autoCleanlocal == "true") {
      hassioApiTools.clean().catch();
    }
    const autoCleanCloud = settingsTools.getSettings().auto_clean_backup;
    if (autoCleanCloud && autoCleanCloud == "true") {
      webdav.clean().catch();
    }
  }
}

const INSTANCE = new CronContainer();
export default INSTANCE;
