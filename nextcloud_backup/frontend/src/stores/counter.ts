import { ref } from "vue";
import { defineStore } from "pinia";
import type { Message } from "@/types/messages";

export const useMessageStore = defineStore("message", () => {
  const messages = ref<Message[]>([]);
  return { messages };
});
