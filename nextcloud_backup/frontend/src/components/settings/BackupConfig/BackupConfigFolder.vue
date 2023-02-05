<template>
  <v-card variant="elevated" elevation="7" height="100%">
    <v-card-title class="text-center text-white bg-light-blue-darken-4">
      Folders
    </v-card-title>
    <v-card-text class="text-white px-2 py-1">
      <div v-if="loading" class="d-flex justify-center">
        <v-progress-circular indeterminate color="orange"></v-progress-circular>
      </div>
      <v-checkbox
        v-else
        v-for="folder in folders"
        v-model="invertedFolders"
        :key="folder.slug"
        :label="folder.name"
        :value="folder.slug"
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
import { watch } from "vue";

defineProps<{ loading: boolean }>();
const backupConfigStore = useBackupConfigStore();

const { data, folders, invertedFolders } = storeToRefs(backupConfigStore);
watch(invertedFolders, manageInverted);

manageInverted();

function manageInverted() {
  if (!data.value.exclude) {
    backupConfigStore.initExcludes();
  }
  data.value.exclude!.folder = [];
  for (const folder of folders.value) {
    if (!invertedFolders.value.includes(folder.slug)) {
      data.value.exclude!.folder.push(folder.slug);
    }
  }
}
</script>

<style scoped></style>
