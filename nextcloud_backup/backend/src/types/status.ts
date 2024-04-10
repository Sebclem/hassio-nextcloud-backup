import type { DateTime } from "luxon";

export enum WebdabStatus {
  OK = "OK",
  LOGIN_FAIL = "LOGIN_FAIL",
  UPLOAD_FAIL = "UPLOAD_FAIL",
  CON_ERROR = "CON_ERROR",
  INIT = "INIT",
  MK_FOLDER_FAIL = "MK_FOLDER_FAIL"
}

export interface Status {
  status: string;
  progress: number;
  last_backup?: string;
  next_backup?: string;
  message?: string;
  error_code?: number;
  webdav: {
    state: WebdabStatus;
    last_check: DateTime;
    blocked: boolean;
  }; 
}
