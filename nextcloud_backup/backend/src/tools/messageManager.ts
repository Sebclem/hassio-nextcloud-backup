import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { Message, MessageType } from "../types/message.js";

const maxMessageLength = 255;

class MessageManager {
  private messages: Message[] = [];

  public addMessage(type: MessageType, message: string, detail?: string, isImportant = false) {
    this.messages.push({
      id: randomUUID(),
      message: message,
      type: type,
      time: DateTime.now(),
      viewed: !isImportant,
      detail: detail
    });
    if (this.messages.length > maxMessageLength) {
      this.messages.shift();
    }
  }

  public error(message: string, detail?: string) {
    this.addMessage(MessageType.ERROR, message, detail, true);
  }

  public warn(message: string, detail?: string) {
    this.addMessage(MessageType.WARN, message, detail);
  }

  public info(message: string, detail?: string) {
    this.addMessage(MessageType.INFO, message, detail);
  }

  public success(message: string, detail?: string) {
    this.addMessage(MessageType.SUCCESS, message, detail);
  }

  public get(){
    return this.messages;
  }
}


const messageManager = new MessageManager();
export default messageManager;
