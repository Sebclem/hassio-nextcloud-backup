<template>
  <div>
    <v-card elevation="10" class="mt-10" border>
      <v-card-title class="text-center"> Cloud </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col>
            <v-card variant="outlined" elevation="5" color="grey-darken-2">
              <v-card-title class="text-center text-white">Auto</v-card-title>
              <v-divider color="grey-darken-3"></v-divider>
              <v-card-text class="pa-0">
                <v-list variant="tonal" class="pa-0">
                  <v-list-item
                    v-if="autoBackups.length == 0"
                    class="text-center text-subtitle-2 text-disabled"
                    >Folder is empty</v-list-item
                  >
                  <cloud-list-item
                    v-for="(item, index) in autoBackups"
                    :key="item.id"
                    :item="item"
                    :index="index"
                  >
                  </cloud-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card variant="outlined" elevation="5" color="grey-darken-2">
              <v-card-title class="text-center text-white">Manual</v-card-title>
              <v-divider color="grey-darken-3"></v-divider>
              <v-card-text class="pa-0">
                <v-list variant="tonal" class="pa-0">
                  <v-list-item
                    v-if="manualBackups.length == 0"
                    class="text-center text-subtitle-2 text-disabled"
                    >Folder is empty</v-list-item
                  >
                  <cloud-list-item
                    v-for="(item, index) in manualBackups"
                    :key="item.id"
                    :item="item"
                    :index="index"
                  >
                  </cloud-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { WebdavBackup } from "@/types/webdav";
import {
  getAutoBackupList,
  getManualBackupList,
} from "@/services/webdavService";

import CloudListItem from "./CloudListItem.vue";

const popup = ref(false);
const autoBackups = ref<WebdavBackup[]>([]);
const manualBackups = ref<WebdavBackup[]>([]);
function refreshBackup() {
  getAutoBackupList().then((value) => {
    autoBackups.value = value;
  });
  getManualBackupList().then((value) => {
    manualBackups.value = value;
  });
}
refreshBackup();
</script>
