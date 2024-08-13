<template>
  <v-card variant="elevated" elevation="7">
    <v-card-title class="bg-light-blue-darken-4 text-center">
      Security
    </v-card-title>
    <v-card-text>
      <v-row justify="center" v-if="loading">
        <v-col class="d-flex justify-center">
          <v-progress-circular
            indeterminate
            color="orange"
          ></v-progress-circular>
        </v-col>
      </v-row>
      <template v-if="!loading">
        <v-row class="mt-1">
          <v-col>
            <v-switch
              label="Password protected backup"
              v-model="data.password.enabled"
              hide-details="auto"
              density="compact"
              inset
              :loading="loading"
              color="orange"
            ></v-switch>
          </v-col>
        </v-row>
        <v-fade-transition>
          <v-row dense v-if="data.password.enabled">
            <v-col>
              <div class="text-subtitle-1 text-medium-emphasis">Password</div>
              <v-text-field
                v-model="data.password.value"
                hide-details="auto"
                density="compact"
                variant="outlined"
                color="orange"
                type="password"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-fade-transition>
      </template>
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