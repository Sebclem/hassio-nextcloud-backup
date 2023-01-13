<template>
  <v-form class="mx-4">
    <v-row>
      <v-col>
        <div class="text-subtitle-1 text-medium-emphasis">Naming template</div>
        <!-- <v-text-field
          placeholder="{type}-{ha_version}-{date}_{hour}"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-tag"
          hide-details="auto"
          v-model="data.config.nameTemplate"
          :error-messages="errors.nameTemplate"
          :loading="loading"
          color="orange"
        >
          <template v-slot:append>
            <v-btn
              color="success"
              variant="outlined"
              class="mt-n2"
              height="auto"
              href="https://github.com/Sebclem/hassio-nextcloud-backup/blob/master/nextcloud_backup/naming_template.md"
              target="_blank"
            >
              <v-icon icon="mdi-help-circle-outline"></v-icon>
            </v-btn>
          </template>
        </v-text-field> -->
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <BackupConfigFolder :loading="loading"></BackupConfigFolder>
      </v-col>
      <v-col cols="12" md="6">
        <BackupConfigAddon :loading="loading"></BackupConfigAddon>
      </v-col>
    </v-row>
    <v-divider class="my-4"></v-divider>
    <v-row>
      <v-col class="text-center">
        <v-sheet border elevation="5" rounded class="py-1">
          <h2>Automation</h2>
        </v-sheet>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <BackupConfigAutoBackup :loading="loading"></BackupConfigAutoBackup>
      </v-col>
    </v-row>
  </v-form>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import { useConfigForm } from "@/composable/ConfigForm";
import { saveBackupConfig } from "@/services/configService";
import { useBackupConfigStore } from "@/stores/backupConfig";
import { CronMode } from "@/types/backupConfig";
import { storeToRefs } from "pinia";
import BackupConfigAddon from "./BackupConfig/BackupConfigAddon.vue";
import BackupConfigFolder from "./BackupConfig/BackupConfigFolder.vue";
import BackupConfigAutoBackup from "./BackupConfig/BackupConfigAutoBackup.vue";

const backupConfigStore = useBackupConfigStore();
const { data, folders, invertedFolders } = storeToRefs(backupConfigStore);
const errors = ref({
  nameTemplate: [],
  username: [],
  password: [],
  backupDir: [],
  allowSelfSignedCerts: [],
  type: [],
  customEndpoint: [],
});

const emit = defineEmits<{
  (e: "success"): void;
  (e: "fail"): void;
  (e: "loaded"): void;
  (e: "loading"): void;
}>();

const { save, loading } = useConfigForm(
  saveBackupConfig,
  backupConfigStore.loadAll,
  data,
  errors,
  emit
);
defineExpose({ save });
</script>
