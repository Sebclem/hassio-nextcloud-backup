import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Message } from "@/types/messages";

export const useMessageStore = defineStore("message", () => {
  const messages = ref<Message[]>([]);
  const countUnreadMessages = computed(() => {
    return messages.value.filter((value) => !value.viewed).length;
  });

  const haveUnreadMessages = computed(() => {
    let unread = false;
    for (const mess of messages.value) {
      if (!mess.viewed) {
        unread = true;
        break;
      }
    }
    return unread;
  });

  return { messages, countUnreadMessages, haveUnreadMessages };
});
