<template>
  <div>
    <v-card elevation="10" class="mt-10" border>
      <v-card-title class="text-center"> Home Assistant </v-card-title>
      <v-divider></v-divider>
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

function refreshBackup() {
  getBackups().then((value) => {
    backups.value = value;
  });
}

refreshBackup();
const interval = setInterval(refreshBackup, 2000);

onBeforeUnmount(() => {
  clearInterval(interval);
});

// TODO Manage delete
</script>
