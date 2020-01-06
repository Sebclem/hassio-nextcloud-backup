const settingsTools = require('./settingsTools');

const WebdavTools = require('./webdavTools')
const webdav = new WebdavTools().getInstance();

const hassioApiTools = require('./hassioApiTools');

const statusTools = require('./status');

var CronJob = require('cron').CronJob;
const moment = require('moment');

function checkConfig(conf) {
    if (conf.cron_base != null) {
        if (conf.cron_base == '1' || conf.cron_base == '2' || conf.cron_base == '3') {
            if (conf.cron_hour != null && conf.cron_hour.match(/\d\d:\d\d/)) {
                if (conf.cron_base == '1')
                    return true;
            }
            else
                return false;
        }

        if (conf.cron_base == '2') {
            if (conf.cron_weekday != null && conf.cron_weekday >= 0 && conf.cron_weekday <= 6)
                return true;
            else
                return false;
        }

        if (conf.cron_base == '3') {
            if (conf.cron_month_day != null && conf.cron_month_day >= 1 && conf.cron_month_day <= 28)
                return true;
            else
                return false;
        }

        if (conf.cron_base == '0')
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

function updatetNextDate(){
    let cronContainer = new Singleton().getInstance();
    cronContainer.updatetNextDate();
}


class CronContainer {
    constructor() {
        this.cronJob = null;
    }

    init() {
        let settings = settingsTools.getSettings();
        let cronStr = "";
        if (this.cronJob != null) {
            console.log("Stoping Cron...")
            this.cronJob.stop();
            this.cronJob = null;
        }
        if(!checkConfig(settingsTools.getSettings())){
            console.log("No Cron settings available.")
            return;
        }
        
        switch (settings.cron_base) {
            case '0':
                console.log("No Cron settings available.")
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
        console.log("Starting Cron...")
        this.cronJob = new CronJob(cronStr, this._createBackup, null, false, Intl.DateTimeFormat().resolvedOptions().timeZone);
        this.cronJob.start();
        this.updatetNextDate();
    }

    updatetNextDate() {
        let date;
        if( this.cronJob == null)
            date = "Not configured";
        else
            date = this.cronJob.nextDate().format('MMM D, YYYY HH:mm');
        let status = statusTools.getStatus();
        status.next_backup = date;
        statusTools.setStatus(status);
    }

    _createBackup() {
        let status = statusTools.getStatus();
        if(status.status == "creating" &&  status.status == "upload" &&  status.status == "download")
            return;
        
        let name = 'Auto-' + moment().format('YYYY-MM-DD_HH:mm');
        hassioApiTools.createNewBackup(name).then((id) => {
            hassioApiTools.downloadSnapshot(id)
                .then(() => {
                    webdav.uploadFile(id, '/Hassio Backup/Auto/' + name + '.tar');
                }).catch(() => {

                })
        }).catch(() => {

        })
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