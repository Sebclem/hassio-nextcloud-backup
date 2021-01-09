const fs = require("fs");

const statusPath = "/data/status.json";

let baseStatus = {
    status: "idle",
    last_backup: null,
    next_backup: null,
};

function init() {
    if (!fs.existsSync(statusPath)) {
        fs.writeFileSync(statusPath, JSON.stringify(baseStatus));
    } else {
        let content = getStatus();
        if (content.status !== "idle") {
            content.status = "idle";
            content.message = null;
            setStatus(content);
        }
    }
}

function getStatus() {
    if (!fs.existsSync(statusPath)) {
        fs.writeFileSync(statusPath, JSON.stringify(baseStatus));
    }
    return JSON.parse(fs.readFileSync(statusPath).toString());
}

function setStatus(state) {
    fs.writeFileSync(statusPath, JSON.stringify(state));
}

exports.init = init;
exports.getStatus = getStatus;
exports.setStatus = setStatus;
