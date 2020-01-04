

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
        
        if ( conf.cron_base == '3'){
            if (conf.cron_month_day != null && conf.cron_month_day >= 1 && conf.cron_month_day <= 28)
                return true;
            else
                return false;
        }

        if(conf.cron_base == '0')
            return true
    }
    else
        return false;

    return false;
}

exports.checkConfig = checkConfig;