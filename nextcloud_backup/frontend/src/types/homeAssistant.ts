export interface Folder {
  name: string;
  slug: string;
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
