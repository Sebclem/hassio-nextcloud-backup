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
}

export interface Status {
  status: States;
  progress?: number;
  last_backup: {
    success?: boolean;
    last_success?: string;
    last_try?: string;
  };
  next_backup?: string;
  webdav: {
    logged_in: boolean;
    folder_created: boolean;
    last_check: string;
  };
  hass: {
    ok: boolean;
    last_check: string;
  };
}
