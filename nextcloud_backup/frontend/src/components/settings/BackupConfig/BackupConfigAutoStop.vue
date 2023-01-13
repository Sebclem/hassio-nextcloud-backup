<template>
  <v-card variant="elevated" elevation="7" height="100%">
    <v-card-title class="text-center text-white bg-light-blue-darken-4">
      Auto Stop Addon
    </v-card-title>
    <v-card-text class="text-white px-2 py-1">
      <div v-if="loading" class="d-flex justify-center">
        <v-progress-circular indeterminate color="orange"></v-progress-circular>
      </div>
      <v-checkbox
        v-else
        v-for="addon in addons"
        v-model="data.autoStopAddon"
        :key="addon.slug"
        :label="addon.name"
        :value="addon.slug"
        :loading="loading"
        hide-details="auto"
        color="orange"
        density="compact"
      >
      </v-checkbox>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useBackupConfigStore } from "@/stores/backupConfig";
import { storeToRefs } from "pinia";

defineProps<{ loading: boolean }>();
const backupConfigStore = useBackupConfigStore();
const { data, addons } = storeToRefs(backupConfigStore);
</script>
