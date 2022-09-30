import { DateTime } from "luxon";

export interface WebdavBackup {
  id: string;
  name: string;
  size: number;
  lastEdit: DateTime;
}