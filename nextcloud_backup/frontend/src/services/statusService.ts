import kyClient from "./kyClient";
import { Status } from "@/types/status";

export function getStatus() {
  return kyClient.get("status").json<Status>();
}
