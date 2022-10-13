import type { Message } from "@/types/messages";
import kyClient from "./kyClient";

export function getMessages() {
  return kyClient.get("messages").json<Message[]>();
}
