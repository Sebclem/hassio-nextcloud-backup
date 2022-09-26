export interface NewPartialBackupPayload {
  name?:	string;
  password?: string;
  homeassistant?: boolean;
  addons?: string[];
  folders?: string[];
  compressed?: boolean;
}