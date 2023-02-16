
export interface SupervisorResponse<T> {
  result: string;
  data: T;
}

export interface CoreInfoBody {
  version: string;
  version_latest: string;
  update_available: boolean;
  arch: string;
  machine: string;
  ip_address: string;
  image: string;
  boot: boolean;
  port: number;
  ssl: boolean;
  watchdog: boolean;
  wait_boot: number;
  audio_input: string;
  audio_output: string;
}

export interface AddonData {
  addons: AddonModel[];
}


export interface AddonModel {
  name: string;
  slug: string;
  advanced: boolean;
  description: string;
  repository: string;
  version: string;
  version_latest: string;
  update_available: boolean;
  installed: string;
  available: boolean;
  icon: boolean;
  logo: boolean;
  state: string;
}

export interface BackupData {
  backups: BackupModel[]
}


export interface BackupModel {
  slug: string;
  date: string;
  name: string;
  type: "full" | "partial";
  protected: boolean;
  content: BackupContent;
  compressed: boolean;
}

export interface BackupContent {
  homeassistant: boolean;
  addons: string[];
  folders: string[];
}

export interface BackupDetailModel {
  slug: string;
  type: "full" | "partial";
  name: string;
  date: string;
  size: string;
  protected: boolean;
  homeassistant: string;
  addons: {
    slug: string;
    name: string;
    version: string;
    size: number;
  }[];
  repositories: string[];
  folders: string[];
}
