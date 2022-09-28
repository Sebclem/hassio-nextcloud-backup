export enum CronMode {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM"
}

export enum Weekday {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY
}


export interface BackupConfig {
  nameTemplate: string;
  cron: CronConfig[];
  autoClean: {
    homeAssistant: AutoCleanConfig;
    webdav: AutoCleanConfig;
  }
  exclude: {
    addon: string[];
    folder: string[];
  }
  autoStopAddon: string[];
  password: {
    enabled: boolean;
    value?: string;
  }
}


export interface CronConfig {
  id: string;
  mode: CronMode;
  hour?: string;
  weekday?: Weekday;
  monthDay: string;
  custom?: string;
}


export interface AutoCleanConfig {
  enabled: boolean;
  nbrToKeep?: number;
}