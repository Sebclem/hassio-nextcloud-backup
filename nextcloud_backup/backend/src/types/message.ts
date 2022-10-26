import type { DateTime } from "luxon";

export enum MessageType {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  SUCCESS = "SUCCESS"
}


export interface Message {
  id: string;
  time: DateTime;
  type: MessageType;
  message: string;
  viewed: boolean;
  detail?: string;
}