import { ref } from "vue";
import { defineStore } from "pinia";

export const useDialogStatusStore = defineStore("dialogStatus", () => {
  const webdav = ref(false);
  const backup = ref(false);
  return { webdav, backup };
});
