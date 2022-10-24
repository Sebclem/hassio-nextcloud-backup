<template>
  <v-dialog
    v-model="dialogStatusStore.webdav"
    persistent
    :width="width"
    :fullscreen="xs"
    scrollable
  >
    <v-card>
      <v-card-title class="text-center">Cloud Settings</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <webdav-settings-form
          ref="form"
          @fail="saving = false"
          @success="dialogStatusStore.webdav = false"
          @loaded="loading = false"
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
import { useDialogStatusStore } from "@/stores/dialogStatus";
import { computed, ref } from "vue";
import { useDisplay } from "vuetify/lib/framework.mjs";
import WebdavSettingsForm from "./WebdavConfigForm.vue";

const dialogStatusStore = useDialogStatusStore();
const form = ref<InstanceType<typeof WebdavSettingsForm> | null>(null);
const loading = ref(true);
const saving = ref(false);
const { xs, mdAndDown } = useDisplay();

let saveLoading = computed(() => {
  return saving.value || loading.value;
});

const width = computed(() => {
  if (xs.value) {
    return undefined;
  } else if (mdAndDown.value) {
    return "80%";
  } else {
    return "50%";
  }
});

function save() {
  saving.value = true;
  form.value?.save();
}
</script>
