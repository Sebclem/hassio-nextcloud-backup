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
                    @upload="upload"
                    @delete="deleteBackup"
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
  <ha-delete-dialog
    ref="deleteDialog"
    @deleted="refreshBackup"
  ></ha-delete-dialog>
</template>

<script lang="ts" setup>
import type { BackupModel } from "@/types/homeAssistant";
import { ref, onBeforeUnmount } from "vue";
import {
  getBackups,
  uploadHomeAssistantBackup,
} from "@/services/homeAssistantService";
import HaListItem from "./HaListItem.vue";
import { useAlertStore } from "@/store/alert";
import HaDeleteDialog from "./HaDeleteDialog.vue";

const deleteDialog = ref<InstanceType<typeof HaDeleteDialog> | null>(null);
const backups = ref<BackupModel[]>([]);

const deleteItem = ref<BackupModel | null>(null);

const loading = ref<boolean>(true);

const alertStore = useAlertStore();

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

function upload(item: BackupModel) {
  uploadHomeAssistantBackup(item.slug)
    .then(() => {
      alertStore.add("success", "Backup upload as started.");
    })
    .catch(() => {
      alertStore.add("error", "Fail to start backup upload !");
    });
}

function deleteBackup(item: BackupModel) {
  deleteItem.value = item;
  deleteDialog.value?.open(item);
}

refreshBackup();

defineExpose({ refreshBackup });
</script>
