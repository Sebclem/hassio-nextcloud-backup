const fs = require("fs");
const logger = require("../config/winston");
const moment = require("moment");
const CronJob = require("cron").CronJob;

const settingsPath = "/data/backup_conf.json";

function check_cron(conf) {
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

        if (conf.cron_base === "4") {
            if (conf.cron_custom != null) {
                try {
                    new CronJob(conf.cron_custom, () => {});
                    return true;
                } catch(e) {
                    return false;
                }
            }else return false;
        }

        if (conf.cron_base === "0") return true;
    } else return false;

    return false;
}

function check(conf, fallback = false) {
    let needSave = false;
    if (!check_cron(conf)) {
        if (fallback) {
            logger.warn("Bad value for cron settings, fallback to default ");
            conf.cron_base = "0";
            conf.cron_hour = "00:00";
            conf.cron_weekday = "0";
            conf.cron_month_day = "1";
            conf.cron_custom = "5 4 * * *";
        } else {
            logger.error("Bad value for cron settings");
            return [false, "Bad cron settings"];
        }
    }
    if (conf.name_template == null) {
        if (fallback) {
            logger.warn("Bad value for 'name_template', fallback to default ");
            conf.name_template = "{type}-{ha_version}-{date}_{hour}";
        } else {
            logger.error("Bad value for 'name_template'");
            return [false, "Bad value for 'name_template'"];
        }
    }
    if (conf.auto_clean_local_keep == null || !/^\d+$/.test(conf.auto_clean_local_keep)) {
        if (fallback) {
            logger.warn("Bad value for 'auto_clean_local_keep', fallback to 5 ");
            conf.auto_clean_local_keep = "5";
        } else {
            logger.error("Bad value for 'auto_clean_local_keep'");
            return [false, "Bad value for 'auto_clean_local_keep'"];
        }
    }
    if (conf.auto_clean_backup_keep == null || !/^\d+$/.test(conf.auto_clean_backup_keep)) {
        if (fallback) {
            logger.warn("Bad value for 'auto_clean_backup_keep', fallback to 5 ");
            conf.auto_clean_backup_keep = "5";
        } else {
            logger.error("Bad value for 'auto_clean_backup_keep'");
            return [false, "Bad value for 'auto_clean_backup_keep'"];
        }
    }
    if (conf.auto_clean_local == null) {
        if (fallback) {
            logger.warn("Bad value for 'auto_clean_local', fallback to false ");
            conf.auto_clean_local = "false";
        } else {
            logger.error("Bad value for 'auto_clean_local'");
            return [false, "Bad value for 'auto_clean_local'"];
        }
    }
    if (conf.auto_clean_backup == null) {
        if (fallback) {
            logger.warn("Bad value for 'auto_clean_backup', fallback to false ");
            conf.auto_clean_backup = "false";
        } else {
            logger.error("Bad value for 'auto_clean_backup'");
            return [false, "Bad value for 'auto_clean_backup'"];
        }
    }
    if (conf.exclude_addon == null) {
        if (fallback) {
            logger.warn("Bad value for 'exclude_addon', fallback to [] ");
            conf.exclude_addon = [];
        } else {
            logger.error("Bad value for 'exclude_addon'");
            return [false, "Bad value for 'exclude_addon'"];
        }
    }
    if (conf.exclude_folder == null) {
        if (fallback) {
            logger.warn("Bad value for 'exclude_folder', fallback to [] ");
            conf.exclude_folder = [];
        } else {
            logger.error("Bad value for 'exclude_folder'");
            return [false, "Bad value for 'exclude_folder'"];
        }
    }
    if (conf.auto_stop_addon == null) {
        if (fallback) {
            logger.warn("Bad value for 'auto_stop_addon', fallback to [] ");
            conf.auto_stop_addon = [];
        } else {
            logger.error("Bad value for 'auto_stop_addon'");
            return [false, "Bad value for 'auto_stop_addon'"];
        }
    }

    if (!Array.isArray(conf.exclude_folder)) {
        logger.debug("exclude_folder is not array (Empty value), reset...");
        conf.exclude_folder = [];
        needSave = true;
    }
    if (!Array.isArray(conf.exclude_addon)) {
        logger.debug("exclude_addon is not array (Empty value), reset...");
        conf.exclude_addon = [];
        needSave = true;
    }
    if (conf.password_protected == null) {
        if (fallback) {
            logger.warn("Bad value for 'password_protected', fallback to false ");
            conf.password_protected = "false";
        } else {
            logger.error("Bad value for 'password_protect_value'");
            return [false, "Bad value for 'password_protect_value'"];
        }
    }

    if (conf.password_protect_value == null) {
        if (fallback) {
            logger.warn("Bad value for 'password_protect_value', fallback to '' ");
            conf.password_protect_value = "";
        } else {
            logger.error("Bad value for 'password_protect_value'");
            return [false, "Bad value for 'password_protect_value'"];
        }
    }

    if (fallback || needSave) {
        setSettings(conf);
    }
    return [true, null];
}

function getFormatedName(is_manual, ha_version) {
    let setting = getSettings();
    let template = setting.name_template;
    template = template.replace("{type_low}", is_manual ? "manual" : "auto");
    template = template.replace("{type}", is_manual ? "Manual" : "Auto");
    template = template.replace("{ha_version}", ha_version);
    let mmt = moment();
    template = template.replace("{hour_12}", mmt.format("hhmmA"));
    template = template.replace("{hour}", mmt.format("HHmm"));
    template = template.replace("{date}", mmt.format("YYYY-MM-DD"));
    return template;
}

function getSettings() {
    if (!fs.existsSync(settingsPath)) {
        return {};
    } else {
        return JSON.parse(fs.readFileSync(settingsPath).toString());
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
