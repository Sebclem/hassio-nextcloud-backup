import type { Message } from "@/types/messages";
import kyClient from "./kyClient";

export function getMessages() {
  return kyClient.get("messages").json<Message[]>();
}

export function markRead(id: string) {
  return kyClient.patch(`messages/${encodeURI(id)}/readed`).json<Message[]>();
}

export function markAllRead(){
  return kyClient.post(`messages/allReaded`).json<Message[]>();
}