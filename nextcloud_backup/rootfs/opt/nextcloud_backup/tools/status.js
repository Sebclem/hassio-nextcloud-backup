import * as hassioApiTools from "./hassioApiTools.js";
import logger from "../config/winston.js"


let status = {
    status: "idle",
    last_backup: null,
    next_backup: null,
};

export function init() {
    if (status.status !== "idle") {
        status.status = "idle";
        status.message = null;
    }
}

export function getStatus() {
    return status;
}

export function setStatus(new_state) {
    let old_state_str = JSON.stringify(status);
    if(old_state_str !== JSON.stringify(new_state)){
        status = new_state;
        hassioApiTools.publish_state(status);
    }
}

export function setError(message, error_code){
    // Check if we don't have another error stored
    if (status.status != "error") {
        status.status = "error"
        status.message = message
        status.error_code = error_code;
    }
    logger.error(message);
}
