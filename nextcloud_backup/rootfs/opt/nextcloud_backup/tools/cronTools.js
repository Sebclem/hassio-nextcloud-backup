const CronJob = require("cron").CronJob;

const settingsTools = require("./settingsTools");
const WebdavTools = require("./webdavTools");
const webdav = new WebdavTools().getInstance();
const hassioApiTools = require("./hassioApiTools");
const statusTools = require("./status");
const pathTools = require("./pathTools");

const logger = require("../config/winston");

function startCron() {
    let cronContainer = new Singleton().getInstance();
    cronContainer.init();
}

function updatetNextDate() {
    let cronContainer = new Singleton().getInstance();
    cronContainer.updateNextDate();
}

class CronContainer {
    constructor() {
        this.cronJob = null;
        this.cronClean = null;
    }

    init() {
        let settings = settingsTools.getSettings();
        let cronStr = "";
        if (this.cronClean == null) {
            logger.info("Starting auto clean cron...");
            this.cronClean = new CronJob("0 1 * * *", this._clean, null, false, Intl.DateTimeFormat().resolvedOptions().timeZone);
            this.cronClean.start();
        }
        if (this.cronJob != null) {
            logger.info("Stopping Cron...");
            this.cronJob.stop();
            this.cronJob = null;
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
                let splited = settings.cron_hour.split(":");
                cronStr = "" + splited[1] + " " + splited[0] + " * * *";
                break;
            }

            case "2": {
                let splited = settings.cron_hour.split(":");
                cronStr = "" + splited[1] + " " + splited[0] + " * * " + settings.cron_weekday;
                break;
            }

            case "3": {
                let splited = settings.cron_hour.split(":");
                cronStr = "" + splited[1] + " " + splited[0] + " " + settings.cron_month_day + " * *";
                break;
            }
            case "4": {
                cronStr = settings.cron_custom;
                break;
            }
        }
        logger.info("Starting Cron...");
        this.cronJob = new CronJob(cronStr, this._createBackup, null, false, Intl.DateTimeFormat().resolvedOptions().timeZone);
        this.cronJob.start();
        this.updateNextDate();
    }

    updateNextDate() {
        let date;
        if (this.cronJob == null) date = null;
        else date = this.cronJob.nextDate().format("MMM D, YYYY HH:mm");
        let status = statusTools.getStatus();
        status.next_backup = date;
        statusTools.setStatus(status);
    }

    _createBackup() {
        logger.debug("Cron triggered !");
        let status = statusTools.getStatus();
        if (status.status === "creating" || status.status === "upload" || status.status === "download" || status.status === "stopping" || status.status === "starting")
            return;
        hassioApiTools.stopAddons()
            .then(() => {
                hassioApiTools.getVersion()
                    .then((version) => {
                        let name = settingsTools.getFormatedName(false, version);
                        hassioApiTools.createNewBackup(name)
                            .then((id) => {
                                hassioApiTools
                                    .downloadSnapshot(id)
                                    .then(() => {
                                        webdav.uploadFile(id, webdav.getConf().back_dir + pathTools.auto + name + ".tar")
                                            .then(() => {
                                                hassioApiTools.startAddons().catch(() => {
                                                });
                                            });
                                    });
                            });
                    });
            })
            .catch(() => {
                hassioApiTools.startAddons().catch(() => {
                });
            });
    }

    _clean() {
        let autoCleanlocal = settingsTools.getSettings().auto_clean_local;
        if (autoCleanlocal != null && autoCleanlocal === "true") {
            hassioApiTools.clean().catch();
        }
        let autoCleanCloud = settingsTools.getSettings().auto_clean_backup;
        if (autoCleanCloud != null && autoCleanCloud === "true") {
            webdav.clean().catch();
        }
    }
}

class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new CronContainer();
        }
    }

    getInstance() {
        return Singleton.instance;
    }
}

exports.startCron = startCron;
exports.updatetNextDate = updatetNextDate;
