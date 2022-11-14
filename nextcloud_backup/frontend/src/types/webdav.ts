import type { DateTime } from "luxon";

export interface WebdavBackup {
  id: string;
  name: string;
  size: number;
  lastEdit: string;
  path: string;
}

export interface WebdavDeletePayload {
  path: string;
}
