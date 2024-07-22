<template>
  <v-form class="mx-4" @submit.prevent>
    <v-row>
      <v-col>
        <div class="text-subtitle-1 text-medium-emphasis">Naming template</div>
        <v-text-field
          placeholder="{type}-{ha_version}-{date}_{hour}"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-tag"
          hide-details="auto"
          v-model="data.nameTemplate"
          :error-messages="errors.nameTemplate"
          :loading="loading"
          color="orange"
        >
          <template v-slot:append>
            <v-btn
              color="success"
              variant="outlined"
              href="https://github.com/Sebclem/hassio-nextcloud-backup/blob/master/nextcloud_backup/naming_template.md"
              target="_blank"
            >
              <v-icon icon="mdi-help-circle-outline"></v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div class="text-subtitle-1 text-medium-emphasis">Backup Type</div>
        <v-select
          :items="
            Object.entries(BackupType).map((value) => {
              return { title: value[0], value: value[1] };
            })
          "
          v-model="data.backupType"
          hide-details="auto"
          density="compact"
          variant="outlined"
          color="orange"
        >
        </v-select>
      </v-col>
    </v-row>
    <v-fade-transition>
      <v-row v-if="data.backupType == BackupType.Partial">
        <v-col cols="12" md="6">
          <BackupConfigFolder :loading="loading"></BackupConfigFolder>
        </v-col>
        <v-col cols="12" md="6">
          <BackupConfigAddon :loading="loading"></BackupConfigAddon>
        </v-col>
      </v-row>
    </v-fade-transition>
    <v-divider class="my-4 border-opacity-25"></v-divider>
    <v-row>
      <v-col class="text-center">
        <v-sheet border elevation="5" rounded class="py-1">
          <h2>Automation</h2>
        </v-sheet>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col>
        <BackupConfigAutoBackup :loading="loading"></BackupConfigAutoBackup>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col>
        <BackupConfigAutoClean :loading="loading"></BackupConfigAutoClean>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col>
        <BackupConfigAutoStop :loading="loading"></BackupConfigAutoStop>
      </v-col>
    </v-row>
    <v-divider class="my-4 border-opacity-25"></v-divider>
    <v-row class="mb-10">
      <v-col>
        <BackupConfigSecurity :loading="loading"></BackupConfigSecurity>
      </v-col>
    </v-row>
  </v-form>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { useConfigForm } from "@/composable/ConfigForm";
import { saveBackupConfig } from "@/services/configService";
import { useBackupConfigStore } from "@/store/backupConfig";
import { storeToRefs } from "pinia";
import BackupConfigAddon from "./BackupConfig/BackupConfigAddon.vue";
import BackupConfigAutoBackup from "./BackupConfig/BackupConfigAutoBackup.vue";
import BackupConfigFolder from "./BackupConfig/BackupConfigFolder.vue";
import BackupConfigAutoClean from "./BackupConfig/BackupConfigAutoClean.vue";
import BackupConfigSecurity from "./BackupConfig/BackupConfigSecurity.vue";
import BackupConfigAutoStop from "./BackupConfig/BackupConfigAutoStop.vue";
import { BackupType } from "@/types/backupConfig";

const backupConfigStore = useBackupConfigStore();
const { data } = storeToRefs(backupConfigStore);
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
