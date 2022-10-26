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
                  <template v-for="(item, index) in autoBackups" :key="item.id">
                    <v-divider
                      v-if="index != 0"
                      color="grey-darken-3"
                    ></v-divider>
                    <v-list-item>
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <template v-slot:append>
                        <v-btn variant="text" icon color="secondary">
                          <v-icon>mdi-information</v-icon>
                        </v-btn>
                        <v-btn variant="text" icon color="red">
                          <v-icon>mdi-trash-can</v-icon>
                        </v-btn>
                      </template>
                    </v-list-item>
                  </template>
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
                  <template
                    v-for="(item, index) in manualBackups"
                    :key="item.id"
                  >
                    <v-divider
                      v-if="index != 0"
                      color="grey-darken-3"
                    ></v-divider>
                    <v-list-item>
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <template v-slot:append>
                        <v-btn variant="text" icon color="secondary">
                          <v-icon>mdi-information</v-icon>
                        </v-btn>
                        <v-btn variant="text" icon color="red">
                          <v-icon>mdi-trash-can</v-icon>
                        </v-btn>
                      </template>
                    </v-list-item>
                  </template>
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
