import type { DateTime } from "luxon";

export interface WebdavBackup {
  id: string;
  name: string;
  size: number;
  lastEdit: DateTime;
  path: string;
  haVersion?: string;
  creationDate?: DateTime;
}


export interface WebdavDelete {
  path: string;
}