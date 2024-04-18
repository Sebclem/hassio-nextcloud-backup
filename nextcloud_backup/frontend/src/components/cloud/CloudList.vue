<template>
  <div>
    <v-card elevation="10" border>
      <v-row align="center" justify="center">
        <v-col offset="2">
          <v-card-title class="text-center"> Cloud </v-card-title>
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

const loading = ref<boolean>(true);

function refreshBackup() {
  loading.value = true;
  getAutoBackupList()
    .then((value) => {
      autoBackups.value = value;
      return getManualBackupList();
    })
    .then((value) => {
      manualBackups.value = value;
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
}

function deleteBackup(item: WebdavBackup) {
  deleteItem.value = item;
  deleteDialog.value?.open(item);
}
refreshBackup();
defineExpose({ refreshBackup });
</script>
