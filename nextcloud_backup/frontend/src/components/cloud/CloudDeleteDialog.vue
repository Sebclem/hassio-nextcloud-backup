<template>
  <div>
    <v-dialog
      v-model="dialog"
      :width="width"
      :fullscreen="xs"
      :persistent="loading"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="red" class="mr-2">mdi-trash-can</v-icon> Delete Cloud
          backup
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          Delete <v-code tag="code">{{ item?.name }}</v-code> backup in cloud ?
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn color="success" @click="dialog = false" :disabled="loading">
            Close
          </v-btn>
          <v-btn color="red" @click="confirm()" :loading="loading">
            <v-icon>mdi-trash-can</v-icon> Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { deleteWebdabBackup } from "@/services/webdavService";
import type { WebdavBackup } from "@/types/webdav";
import { computed, ref } from "vue";
import { useDisplay } from "vuetify/dist/vuetify";

const { xs, mdAndDown } = useDisplay();
const dialog = ref(false);
const loading = ref(false);
const item = ref<WebdavBackup | null>(null);

const width = computed(() => {
  if (xs.value) {
    return undefined;
  } else if (mdAndDown.value) {
    return "80%";
  } else {
    return "50%";
  }
});

function confirm() {
  loading.value = true;
  if (item.value) {
    deleteWebdabBackup(item.value?.path)
      .then(() => {
        loading.value = false;
        dialog.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }
}

function open(value: WebdavBackup) {
  item.value = value;
  dialog.value = true;
}
defineExpose({ open });
</script>
