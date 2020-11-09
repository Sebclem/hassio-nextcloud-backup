const fs = require("fs");

const settingsPath = "/data/backup_conf.json";

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
