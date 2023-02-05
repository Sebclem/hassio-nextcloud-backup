import type { Ref } from "vue";

export interface Alert {
  id: string;
  type: "error" | "success" | "warning" | "info";
  message: string;
  timeOut: Ref<number>;
  interval: number;
}
