<template>
  <v-dialog
    v-model="dialogStatusStore.webdav"
    persistent
    :width="width"
    :fullscreen="isFullScreen"
    scrollable
  >
    <v-card>
      <v-card-title class="text-center">Cloud Settings</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <webdav-settings-form
          ref="form"
          @fail="fail"
          @success="saved"
          @loaded="loading = false"
          @loading="loading = true"
        ></webdav-settings-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="justify-end">
        <v-btn
          color="red"
          @click="dialogStatusStore.webdav = false"
          :disabled="saving"
          >Cancel</v-btn
        >
        <v-btn color="success" @click="save()" :loading="saveLoading"
          >Save</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useMenuSize } from "@/composable/menuSize";
import { useAlertStore } from "@/store/alert";
import { useDialogStatusStore } from "@/store/dialogStatus";
import { computed, ref } from "vue";
import WebdavSettingsForm from "./WebdavConfigForm.vue";

const alertStore = useAlertStore();

const dialogStatusStore = useDialogStatusStore();
const form = ref<InstanceType<typeof WebdavSettingsForm> | null>(null);
const { width, isFullScreen } = useMenuSize();
const loading = ref(true);
const saving = ref(false);

let saveLoading = computed(() => {
  return saving.value || loading.value;
});

function save() {
  saving.value = true;
  form.value?.save();
}

function fail() {
  saving.value = false;
  alertStore.add("error", "Fail to save cloud settings !");
}

function saved() {
  dialogStatusStore.webdav = false;
  saving.value = false;
  alertStore.add("success", "Cloud settings saved !");
}
</script>
@/store/alert@/store/dialogStatus