export interface NewBackupPayload {
  name?: string;
  password?: string;
  homeassistant?: boolean;
  addons?: string[];
  folders?: string[];
  compressed?: boolean;
}
