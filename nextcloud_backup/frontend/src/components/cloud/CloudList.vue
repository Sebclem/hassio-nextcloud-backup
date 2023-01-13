<template>
  <div>
    <v-card elevation="10" class="mt-10" border>
      <v-card-title class="text-center"> Cloud </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col>
            <v-card variant="elevated" elevation="7" height="100%">
              <v-card-title
                class="text-center text-white bg-light-blue-darken-4"
              >
                Auto
              </v-card-title>
              <v-divider color="grey-darken-3"></v-divider>
              <v-card-text class="pa-0">
                <v-list class="pa-0">
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
                    @delete="deleteBackup"
                  >
                  </cloud-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card variant="elevated" elevation="7" height="100%">
              <v-card-title
                class="text-center text-white bg-light-blue-darken-4"
                >Manual</v-card-title
              >
              <v-divider color="grey-darken-3"></v-divider>
              <v-card-text class="pa-0">
                <v-list class="pa-0">
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
                    @delete="deleteBackup"
                  >
                  </cloud-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <cloud-delete-dialog ref="deleteDialog"></cloud-delete-dialog>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { WebdavBackup } from "@/types/webdav";
import {
  getAutoBackupList,
  getManualBackupList,
} from "@/services/webdavService";
import CloudDeleteDialog from "./CloudDeleteDialog.vue";
import CloudListItem from "./CloudListItem.vue";

const deleteDialog = ref<InstanceType<typeof CloudDeleteDialog> | null>(null);
const deleteItem = ref<WebdavBackup | null>(null);
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

function deleteBackup(item: WebdavBackup) {
  deleteItem.value = item;
  deleteDialog.value?.open(item);
}
refreshBackup();

const interval = setInterval(refreshBackup, 2000);

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
