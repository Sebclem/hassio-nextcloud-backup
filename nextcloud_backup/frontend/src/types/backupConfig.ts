export enum CronMode {
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Monthly = "MONTHLY",
  Custom = "CUSTOM",
}

export enum CronModeFriendly {
  DAILY = "Daily",
  WEEKLY = "Weekly",
  MONTHLY = "Monthly",
  CUSTOM = "Custom",
}

export enum Weekday {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export const weekdayFriendly = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface BackupConfig {
  nameTemplate: string;
  cron: CronConfig[];
  autoClean: {
    homeAssistant: AutoCleanConfig;
    webdav: AutoCleanConfig;
  };
  exclude: {
    addon: string[];
    folder: string[];
  };
  autoStopAddon: string[];
  password: {
    enabled: boolean;
    value?: string;
  };
}

export interface CronConfig {
  id: string;
  mode: CronMode;
  hour?: string;
  weekday?: Weekday;
  monthDay?: string;
  custom?: string;
}

export interface AutoCleanConfig {
  enabled: boolean;
  nbrToKeep?: number;
}
