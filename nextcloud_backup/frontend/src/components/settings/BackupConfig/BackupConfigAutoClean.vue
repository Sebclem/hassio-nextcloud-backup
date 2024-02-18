<template>
  <v-card variant="elevated" elevation="7">
    <v-card-title class="bg-light-blue-darken-4 text-center">
      Auto Clean
    </v-card-title>
    <v-card-text>
      <v-row class="mt-0" v-if="!loading">
        <v-col class="" cols="12" md="6">
          <v-row dense>
            <v-col>
              <v-switch
                label="Auto clean Home Assistant backups"
                v-model="data.autoClean.homeAssistant.enabled"
                hide-details="auto"
                density="compact"
                inset
                :loading="loading"
                color="orange"
              ></v-switch>
            </v-col>
          </v-row>
          <v-fade-transition>
            <v-row dense v-if="data.autoClean.homeAssistant.enabled">
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Number of backup to keep
                </div>
                <v-text-field
                  v-model="data.autoClean.homeAssistant.nbrToKeep"
                  type="number"
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                  min="1"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-fade-transition>
        </v-col>
        <v-col cols="12" md="6">
          <v-row dense>
            <v-col>
              <v-switch
                label="Auto clean Cloud backups"
                v-model="data.autoClean.webdav.enabled"
                hide-details="auto"
                density="compact"
                inset
                :loading="loading"
                color="orange"
              ></v-switch>
            </v-col>
          </v-row>
          <v-fade-transition>
            <v-row dense v-if="data.autoClean.webdav.enabled">
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Number of backup to keep
                </div>
                <v-text-field
                  v-model="data.autoClean.webdav.nbrToKeep"
                  type="number"
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                  min="1"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-fade-transition>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { useBackupConfigStore } from "@/store/backupConfig";
import { storeToRefs } from "pinia";

defineProps<{ loading: boolean }>();
const backupConfigStore = useBackupConfigStore();
const { data } = storeToRefs(backupConfigStore);
</script>
@/store/backupConfig