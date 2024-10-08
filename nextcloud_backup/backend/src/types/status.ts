import type { DateTime } from "luxon";

export enum States {
  IDLE = "IDLE",
  BKUP_CREATION = "BKUP_CREATION",
  BKUP_DOWNLOAD_HA = "BKUP_DOWNLOAD_HA",
  BKUP_DOWNLOAD_CLOUD = "BKUP_DOWNLOAD_CLOUD",
  BKUP_UPLOAD_HA = "BKUP_UPLOAD_HA",
  BKUP_UPLOAD_CLOUD = "BKUP_UPLOAD_CLOUD",
  STOP_ADDON = "STOP_ADDON",
  START_ADDON = "START_ADDON",
  CLEAN_CLOUD = "CLEAN_CLOUD",
  CLEAN_HA = "CLEAN_HA",
}

export interface Status {
  status: States;
  progress?: number;
  last_backup: {
    success?: boolean;
    last_success?: DateTime;
    last_try?: DateTime;
  };
  next_backup?: DateTime;
  webdav: {
    logged_in: boolean;
    folder_created: boolean;
    last_check: DateTime;
  };
  hass: {
    ok: boolean;
    last_check: DateTime;
  };
}
