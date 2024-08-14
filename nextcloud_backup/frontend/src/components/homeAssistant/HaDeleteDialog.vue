<template>
  <div>
    <v-dialog
      v-model="dialog"
      :width="width"
      :fullscreen="isFullScreen"
      :persistent="loading"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="red" class="mr-2">mdi-trash-can</v-icon> Delete Home
          Assistant backup
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          Delete <v-code tag="code">{{ item?.name }}</v-code> backup in Home
          Assistant ?
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn color="success" @click="dialog = false" :disabled="loading">
            Close
          </v-btn>
          <v-btn color="red" @click="confirm()" :loading="loading">
            <v-icon>mdi-trash-can</v-icon> Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useMenuSize } from "@/composable/menuSize";
import { deleteHomeAssistantBackup } from "@/services/homeAssistantService";
import { useAlertStore } from "@/store/alert";
import { BackupModel } from "@/types/homeAssistant";
import { ref } from "vue";

const dialog = ref(false);
const loading = ref(false);
const item = ref<BackupModel | null>(null);

const { width, isFullScreen } = useMenuSize();

const emit = defineEmits<{
  (e: "deleted"): void;
}>();

const alertStore = useAlertStore();
function confirm() {
  loading.value = true;
  if (item.value) {
    deleteHomeAssistantBackup(item.value.slug)
      .then(() => {
        loading.value = false;
        dialog.value = false;
        alertStore.add("success", "Backup deleted from Home Assistant");
        emit("deleted");
      })
      .catch(() => {
        loading.value = false;
        alertStore.add("error", "Fail to deleted backup from Home Assistant");
      });
  }
}

function open(value: BackupModel) {
  item.value = value;
  dialog.value = true;
}
defineExpose({ open });
</script>
