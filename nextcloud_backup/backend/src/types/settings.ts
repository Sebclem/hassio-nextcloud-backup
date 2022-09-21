export interface Settings {
  name_template?: string;
  cron_base?: string;
  cron_hour?: string;
  cron_weekday?: number;
  cron_month_day?: number;
  cron_custom?: string;
  auto_clean_local?: string;
  auto_clean_local_keep?: string;
  auto_clean_backup?: string;
  auto_clean_backup_keep?: string;
  auto_stop_addon?: string[];
  password_protected?: string;
  password_protect_value?: string;
  exclude_addon: string[];
  exclude_folder: string[];
}

export interface WebdavSettings {
  ssl: boolean;
  host: string;
  username: string; 
  password: string;
  back_dir: string;
  self_signed: boolean;
}