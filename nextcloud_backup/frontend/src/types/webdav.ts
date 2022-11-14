export interface WebdavBackup {
  id: string;
  name: string;
  size: number;
  lastEdit: string;
  path: string;
  haVersion?: string;
  creationDate?: string;
}

export interface WebdavDeletePayload {
  path: string;
}
