const settingsTools = require('./settingsTools');

const WebdavTools = require('./webdavTools');
const webdav = new WebdavTools().getInstance();

const hassioApiTools = require('./hassioApiTools');

const statusTools = require('./status');

const pathTools = require('./pathTools');

const CronJob = require('cron').CronJob;
const moment = require('moment');
const logger = require('../config/winston');


function checkConfig(conf) {
    if (conf.cron_base != null) {
        if (conf.cron_base === '1' || conf.cron_base === '2' || conf.cron_base === '3') {
            if (conf.cron_hour != null && conf.cron_hour.match(/\d\d:\d\d/)) {
                if (conf.cron_base === '1')
                    return true;
            }
            else
                return false;
        }

        if (conf.cron_base === '2') {
            return conf.cron_weekday != null && conf.cron_weekday >= 0 && conf.cron_weekday <= 6;
        }

        if (conf.cron_base === '3') {
            return conf.cron_month_day != null && conf.cron_month_day >= 1 && conf.cron_month_day <= 28;
        }

        if (conf.cron_base === '0')
            return true
    }
    else
        return false;

    return false;
}

function startCron() {
    let cronContainer = new Singleton().getInstance();
    cronContainer.init();
}

function updatetNextDate() {
    let cronContainer = new Singleton().getInstance();
    cronContainer.updatetNextDate();
}


class CronContainer {
    constructor() {
        this.cronJob = null;
        this.cronClean = null
    }

    init() {
        let settings = settingsTools.getSettings();
        let cronStr = "";
        if (this.cronClean == null) {
           logger.info("Starting auto clean cron...");
            this.cronClean = new CronJob('0 1 * * *', this._clean, null, false, Intl.DateTimeFormat().resolvedOptions().timeZone);
            this.cronClean.start();
        }
        if (this.cronJob != null) {
            logger.info("Stoping Cron...");
            this.cronJob.stop();
            this.cronJob = null;
        }
        if (!checkConfig(settingsTools.getSettings())) {
            logger.warn("No Cron settings available.");
            return;
        }

        switch (settings.cron_base) {
            case '0':
                logger.warn("No Cron settings available.");
                return;
            case '1': {
                let splited = settings.cron_hour.split(':');
                cronStr = "" + splited[1] + " " + splited[0] + " * * *";
                break;
            }

            case '2': {
                let splited = settings.cron_hour.split(':');
                cronStr = "" + splited[1] + " " + splited[0] + " * * " + settings.cron_weekday;
                break;
            }

            case '3': {
                let splited = settings.cron_hour.split(':');
                cronStr = "" + splited[1] + " " + splited[0] + " " + settings.cron_month_day + " * *";
                break;
            }


        }
        logger.info("Starting Cron...");
        this.cronJob = new CronJob(cronStr, this._createBackup, null, false, Intl.DateTimeFormat().resolvedOptions().timeZone);
        this.cronJob.start();
        this.updatetNextDate();
    }

    updatetNextDate() {
        let date;
        if (this.cronJob == null)
            date = "Not configured";
        else
            date = this.cronJob.nextDate().format('MMM D, YYYY HH:mm');
        let status = statusTools.getStatus();
        status.next_backup = date;
        statusTools.setStatus(status);
    }

    _createBackup() {
        logger.debug('Cron triggered !');
        let status = statusTools.getStatus();
        if (status.status === "creating" || status.status === "upload" || status.status === "download")
            return;

        let name = 'Auto-' + moment().format('YYYY-MM-DD_HHmm');
        hassioApiTools.createNewBackup(name).then((id) => {
            hassioApiTools.downloadSnapshot(id)
                .then(() => {
                    webdav.uploadFile(id, pathTools.auto + name + '.tar');
                }).catch(() => {

                })
        }).catch(() => {

        })
    }

    _clean() {
        let autoCleanlocal = settingsTools.getSettings().auto_clean_local;
        if (autoCleanlocal != null && autoCleanlocal === "true") {
            hassioApiTools.clean();
        }
        let autoCleanCloud = settingsTools.getSettings().auto_clean_backup;
        if (autoCleanCloud != null && autoCleanCloud === "true") {
            this.clean().catch();
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

exports.checkConfig = checkConfig;
exports.startCron = startCron;
exports.updatetNextDate = updatetNextDate;
