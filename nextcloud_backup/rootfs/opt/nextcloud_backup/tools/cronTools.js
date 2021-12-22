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
        this.cronJobs = [];
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
  
        if (!settingsTools.check_cron(settingsTools.getSettings())) {
            logger.warn("No Cron settings available.");
            return;
        }

        if(this.cronJobs.length != 0){
            this._clean_cron_jobs();
        }
        
        if (settings.cron.length == 0){
            logger.warn("No Cron settings available.");
        }
        else {
            let i = 0;
            for(let cron of settings.cron){
                logger.info(`Starting cron #${i} ...`)
                switch (cron.cron_base) {
                    case "1": {
                        let splited = cron.cron_hour.split(":");
                        cronStr = "" + splited[1] + " " + splited[0] + " * * *";
                        break;
                    }
        
                    case "2": {
                        let splited = cron.cron_hour.split(":");
                        cronStr = "" + splited[1] + " " + splited[0] + " * * " + cron.cron_weekday;
                        break;
                    }
        
                    case "3": {
                        let splited = cron.cron_hour.split(":");
                        cronStr = "" + splited[1] + " " + splited[0] + " " + cron.cron_month_day + " * *";
                        break;
                    }
                    case "4": {
                        cronStr = cron.cron_custom;
                        break;
                    }
                }
                this.cronJobs.push(new CronJob(cronStr, this._createBackup, null, true, Intl.DateTimeFormat().resolvedOptions().timeZone));
                i ++ ;
            }
        }
        
        this.updateNextDate();
    }

    updateNextDate() {
        let date;
        if (this.cronJobs.length == 0) 
            date = null;
        else {
            let last_date = null;
            for(let item of this.cronJobs){
                if(last_date == null)
                    last_date = item.nextDate();
                else{
                    if(last_date > item.nextDate())
                        last_date = item.nextDate();
                }
            }
            date = last_date.format("MMM D, YYYY HH:mm");
        }
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

    _clean_cron_jobs(){
        let i = 0;
        for(let elem of this.cronJobs){
            logger.info(`Stopping Crong job #${i}`)
            elem.stop();
            i++;
        }
        this.cronJobs = []
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
