import type { Alert } from "@/types/alert";
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { v4 as uuidv4 } from "uuid";

export const useAlertStore = defineStore("alert", () => {
  const alertList = ref([]) as Ref<Alert[]>;
  const timeOutValue = ref(100);

  function add(
    type: "error" | "success" | "warning" | "info",
    message: string
  ) {
    const alert: Alert = {
      id: uuidv4(),
      timeOut: ref(timeOutValue.value),
      interval: setInterval(() => {
        timeout(alert);
      }, 50),
      type: type,
      message: message,
    };
    alertList.value.push(alert);
  }

  function timeout(alert: Alert) {
    if (alert.timeOut.value <= 0) {
      remove(alert.id!);
    } else {
      alert.timeOut.value--;
    }
  }

  function remove(id: string) {
    const alertToRemove = alertList.value.find((value) => value.id == id);
    if (alertToRemove) {
      clearInterval(alertToRemove.interval);
    }
    alertList.value = alertList.value.filter((value) => value.id != id);
  }
  return { alertList, timeOutValue, add, remove };
});
