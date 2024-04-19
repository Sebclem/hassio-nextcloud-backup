<template>
  <v-dialog
    v-model="dialogStatusStore.backup"
    persistent
    :width="width"
    :fullscreen="isFullScreen"
    scrollable
  >
    <v-card>
      <v-card-title class="text-center">Backup Settings</v-card-title>
      <v-divider class="border-opacity-25"></v-divider>
      <v-card-text>
        <backup-config-form
          ref="form"
          @fail="fail"
          @success="saved"
          @loaded="loading = false"
          @loading="loading = true"
        ></backup-config-form>
      </v-card-text>
      <v-divider class="border-opacity-25"></v-divider>
      <v-card-actions class="justify-end">
        <v-btn
          color="red"
          @click="dialogStatusStore.backup = false"
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
import { useDialogStatusStore } from "@/store/dialogStatus";
import { computed, ref } from "vue";
import { useMenuSize } from "@/composable/menuSize";
import BackupConfigForm from "./BackupConfigForm.vue";
import { useAlertStore } from "@/store/alert";

const alertStore = useAlertStore();

const dialogStatusStore = useDialogStatusStore();
const form = ref<InstanceType<typeof BackupConfigForm> | null>(null);
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
  alertStore.add("error", "Fail to save backup settings !");
}

function saved() {
  dialogStatusStore.backup = false;
  saving.value = false;
  alertStore.add("success", "Backup settings saved !");
}
</script>
@/store/dialogStatus@/store/alert
