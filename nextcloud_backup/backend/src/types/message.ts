import { DateTime } from "luxon";

export enum MessageType {
  ERROR,
  WARN,
  INFO,
  SUCCESS
}


export interface Message {
  time: DateTime;
  type: MessageType;
  message: string;
  detail?: string;
}