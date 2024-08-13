import { States, type Status } from "../types/status.js";
import { DateTime } from "luxon";

let status: Status = {
  status: States.IDLE,
  last_backup: {},
  next_backup: undefined,
  progress: undefined,
  webdav: {
    logged_in: false,
    folder_created: false,
    last_check: DateTime.now(),
  },
  hass: {
    ok: false,
    last_check: DateTime.now(),
  },
};

export function init() {
  if (status.status !== States.IDLE) {
    status.status = States.IDLE;
    status.progress = undefined;
  }
}

export function getStatus() {
  return status;
}

export function setStatus(new_state: Status) {
  const old_state_str = JSON.stringify(status);
  if (old_state_str !== JSON.stringify(new_state)) {
    status = new_state;
    // publish_state(status);
  }
}
