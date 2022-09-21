import * as hassioApiTools from "./hassioApiTools.js";
import logger from "../config/winston.js"
import { type Status } from "../types/status.js";

let status: Status = {
    status: "idle",
    last_backup: undefined,
    next_backup: undefined,
    progress: -1,
};

export function init() {
    if (status.status !== "idle") {
        status.status = "idle";
        status.message = undefined;
        status.progress = -1;
    }
}

export function getStatus() {
    return status;
}

export function setStatus(new_state: Status) {
    const old_state_str = JSON.stringify(status);
    if(old_state_str !== JSON.stringify(new_state)){
        status = new_state;
        hassioApiTools.publish_state(status);
    }
}

export function setError(message: string, error_code: number){
    // Check if we don't have another error stored
    if (status.status != "error") {
        status.status = "error"
        status.message = message
        status.error_code = error_code;
    }
    logger.error(message);
}
