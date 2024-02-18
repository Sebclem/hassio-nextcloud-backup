import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { type Message, MessageType } from "../types/message.js";

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

  public getById(id: string){
    return this.messages.find(value=>value.id == id);
  } 

  public markReaded(id: string){
    const index = this.messages.findIndex(value=>value.id == id);
    if(index == -1){
      return false;
    }
    this.messages[index].viewed = true;
    return true;
  }
}


const messageManager = new MessageManager();
export default messageManager;
