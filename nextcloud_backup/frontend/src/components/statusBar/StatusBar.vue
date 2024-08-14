<template>
  <v-row class="mt-5 justify-space-around">
    <v-col cols="12" lg="4" xxl="3">
      <ConnectionStatus :status="status"></ConnectionStatus>
    </v-col>
    <v-col cols="12" lg="4" xxl="3">
      <BackupStatus :status="status"></BackupStatus>
    </v-col>
    <v-col cols="12" sm="12" lg="4" xxl="3">
      <ActionComponent></ActionComponent>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { getStatus } from "@/services/statusService";
import { States, Status } from "@/types/status";
import { ref, onBeforeUnmount } from "vue";
import ConnectionStatus from "./ConnectionStatus.vue";
import BackupStatus from "./BackupStatus.vue";
import ActionComponent from "./ActionComponent.vue";

const status = ref<Status | undefined>(undefined);

let oldStatus: States | undefined = undefined;

const emit = defineEmits<{
  (e: "stateUpdated", state: string): void;
}>();

function refreshStatus() {
  getStatus().then((data) => {
    status.value = data;
    if (oldStatus != status.value.status) {
      oldStatus = status.value.status;
      emit("stateUpdated", status.value.status);
    }
  });
}

refreshStatus();
const interval = setInterval(refreshStatus, 500);
onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
