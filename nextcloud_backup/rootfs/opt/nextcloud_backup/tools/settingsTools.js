const fs = require("fs");
const logger = require("../config/winston");
const moment = require('moment')

const settingsPath = "/data/backup_conf.json";

function check_cron(conf){
    if (conf.cron_base != null) {
        if (conf.cron_base === "1" || conf.cron_base === "2" || conf.cron_base === "3") {
            if (conf.cron_hour != null && conf.cron_hour.match(/\d\d:\d\d/)) {
                if (conf.cron_base === "1") return true;
            } else return false;
        }
        
        if (conf.cron_base === "2") {
            return conf.cron_weekday != null && conf.cron_weekday >= 0 && conf.cron_weekday <= 6;
        }
        
        if (conf.cron_base === "3") {
            return conf.cron_month_day != null && conf.cron_month_day >= 1 && conf.cron_month_day <= 28;
        }
        
        if (conf.cron_base === "0") return true;
    } else return false;
    
    return false;
}


function check(conf, fallback = false){
    if(!check_cron(conf)){
        if(fallback){
            logger.warn("Bad value for cron settings, fallback to default ")
            conf.cron_base = "0";
            conf.cron_hour = "00:00",
            conf.cron_weekday = "0",
            conf.cron_month_day = "1"
        }
        else {
            logger.error("Bad value for cron settings")
            return false;
        }
    }
    if(conf.name_template == null){
        if(fallback){
            logger.warn("Bad value for 'name_template', fallback to default ")
            conf.name_template = "{type}-{ha_version}-{date}_{hour}"
        }
        else {
            logger.error("Bad value for 'name_template'")
            return false;
        }
    }
    if(conf.auto_clean_local_keep == null || !/^\d+$/.test(conf.auto_clean_local_keep)){
        
        if(fallback){
            logger.warn("Bad value for 'auto_clean_local_keep', fallback to 5 ")
            conf.auto_clean_local_keep = "5"
        }
        else {
            logger.error("Bad value for 'auto_clean_local_keep'")
            return false;
        }
    }
    if(conf.auto_clean_backup_keep == null || !/^\d+$/.test(conf.auto_clean_backup_keep)){
        if(fallback){
            logger.warn("Bad value for 'auto_clean_backup_keep', fallback to 5 ")
            conf.auto_clean_backup_keep = "5"
        }
        else {
            logger.error("Bad value for 'auto_clean_backup_keep'")
            return false;
        }
    }
    if(conf.auto_clean_local == null){
        if(fallback){
            logger.warn("Bad value for 'auto_clean_local', fallback to false ")
            conf.auto_clean_local = "false"
        }
        else {
            logger.error("Bad value for 'auto_clean_local'")
            return false;
        }
    }
    if(conf.auto_clean_backup == null){
        if(fallback){
            logger.warn("Bad value for 'auto_clean_backup', fallback to false ")
            conf.auto_clean_backup = "false"
        }
        else {
            logger.error("Bad value for 'auto_clean_backup'")
            return false;
        }
    }
    if(fallback){
        setSettings(conf);
    }
    return true
    
}

function getFormatedName(is_manual, ha_version){
    let setting = getSettings();
    let template = setting.name_template;
    template = template.replace('{type_low}', is_manual ? 'manual' : 'auto');
    template = template.replace('{type}', is_manual ? 'Manual' : 'Auto');
    template = template.replace('{ha_version}', ha_version);
    let mmt = moment()
    template = template.replace('{hour_12}', mmt.format('hh:mmA'));
    template = template.replace('{hour}', mmt.format('HH:mm'));
    template = template.replace('{date}', mmt.format('YYYY-MM-DD'));
    return  template
}

function getSettings() {
    if (!fs.existsSync(settingsPath)) {
        return {};
    } else {
        let rawSettings = fs.readFileSync(settingsPath);
        return JSON.parse(rawSettings);
    }
}

function setSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
}

exports.getSettings = getSettings;
exports.setSettings = setSettings;
exports.check = check;
exports.check_cron = check_cron;
exports.getFormatedName = getFormatedName;
