<template>
  <div>
    <v-card elevation="10" border>
      <v-row align="center" justify="center">
        <v-col offset="2">
          <v-card-title class="text-center"> Home Assistant </v-card-title>
        </v-col>
        <v-col cols="2">
          <v-btn
            class="float-right mr-2"
            icon="mdi-refresh"
            variant="text"
            @click="refreshBackup"
            :loading="loading"
          ></v-btn>
        </v-col>
      </v-row>
      <v-divider class="border-opacity-25"></v-divider>
      <v-card-text>
        <v-row>
          <v-col>
            <v-card>
              <v-card-title
                class="text-center text-white bg-light-blue-darken-4"
                >Backups</v-card-title
              >
              <v-divider></v-divider>
              <v-card-text class="pa-0">
                <v-list class="pa-0">
                  <v-list-item
                    v-if="backups.length == 0"
                    class="text-center text-subtitle-2 text-disabled"
                    >No backup in Home Assistant</v-list-item
                  >
                  <ha-list-item
                    v-for="(item, index) in backups"
                    :key="item.slug"
                    :item="item"
                    :index="index"
                  >
                  </ha-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import type { BackupModel } from "@/types/homeAssistant";
import { ref, onBeforeUnmount } from "vue";
import { getBackups } from "@/services/homeAssistantService";
import HaListItem from "./HaListItem.vue";

const backups = ref<BackupModel[]>([]);
const loading = ref<boolean>(true);

function refreshBackup() {
  loading.value = true;
  getBackups()
    .then((value) => {
      backups.value = value;
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
}

refreshBackup();

defineExpose({ refreshBackup });

// TODO Manage delete
</script>
