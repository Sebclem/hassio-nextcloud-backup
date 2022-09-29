export enum WebdavEndpointType {
  NEXTCLOUD = "NEXTCLOUD",
  CUSTOM = "CUSTOM"
}


export interface WebdavConfig {
  url: string;
  username: string;
  password: string;
  backupDir: string;
  allowSelfSignedCerts: boolean
  webdavEndpoint: {
    type: WebdavEndpointType;
    customEndpoint?: string; 
  }
}