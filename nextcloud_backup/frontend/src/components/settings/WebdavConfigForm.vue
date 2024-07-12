<template>
  <v-form class="mx-4">
    <v-row>
      <v-col>
        <div class="text-subtitle-1 text-medium-emphasis">URL</div>
        <v-text-field
          placeholder="https://exemple.com"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-web"
          hide-details="auto"
          v-model="data.url"
          :error-messages="errors.url"
          :loading="loading"
          color="orange"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div class="text-subtitle-1 text-medium-emphasis">Endpoint</div>
        <v-select
          variant="outlined"
          density="compact"
          :items="items"
          hide-details="auto"
          v-model="data.webdavEndpoint.type"
          :error-messages="errors.type"
          :loading="loading"
          color="orange"
        >
        </v-select>
      </v-col>
    </v-row>
    <div v-if="data.webdavEndpoint.type == WebdavEndpointType.CUSTOM">
      <v-row>
        <v-col>
          <div class="text-subtitle-1 text-medium-emphasis">
            Custom endpoint
          </div>
          <v-text-field
            placeholder="/remote.php/dav/files/$username"
            hint="You can use the $username variable"
            variant="outlined"
            density="compact"
            hide-details="auto"
            v-model="data.webdavEndpoint.customEndpoint"
            :error-messages="errors.customEndpoint"
            :loading="loading"
            color="orange"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <div class="text-subtitle-1 text-medium-emphasis">
            Custom chunk endpoint
          </div>
          <v-text-field
            placeholder="/remote.php/dav/uploads/$username"
            hint="You can use the $username variable"
            variant="outlined"
            density="compact"
            hide-details="auto"
            v-model="data.webdavEndpoint.customChunkEndpoint"
            :error-messages="errors.customChunkEndpoint"
            :loading="loading"
            color="orange"
          ></v-text-field>
        </v-col>
      </v-row>
    </div>

    <v-row class="mt-0">
      <v-col class="d-flex align-content-end">
        <v-switch
          label="Allow self signed certificate"
          v-model="data.allowSelfSignedCerts"
          hide-details="auto"
          density="compact"
          inset
          :error-messages="errors.allowSelfSignedCerts"
          :loading="loading"
          color="orange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col class="d-flex align-content-end">
        <v-switch
          label="Chunked upload (Beta)"
          v-model="data.chunckedUpload"
          hide-details="auto"
          density="compact"
          inset
          :error-messages="errors.chunckedUpload"
          :loading="loading"
          color="orange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col><v-divider></v-divider></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-alert type="info" variant="outlined">
          You need to use <b>App password</b>.<br />
          More info
          <a
            target="_blank"
            href="https://github.com/Sebclem/hassio-nextcloud-backup/blob/master/nextcloud_backup/DOCS.md#nextcloud-config"
          >
            here.
          </a>
        </v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <div class="text-subtitle-1 text-medium-emphasis">Username</div>
        <v-text-field
          variant="outlined"
          density="compact"
          placeholder="Username"
          prepend-inner-icon="mdi-account"
          hide-details="auto"
          v-model="data.username"
          :error-messages="errors.username"
          :loading="loading"
          color="orange"
        >
        </v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <div class="text-subtitle-1 text-medium-emphasis">App password</div>
        <v-text-field
          placeholder="App password"
          type="password"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-key"
          hide-details="auto"
          v-model="data.password"
          :error-messages="errors.password"
          :loading="loading"
          color="orange"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col><v-divider></v-divider></v-col>
    </v-row>
    <v-row>
      <v-col>
        <div class="text-subtitle-1 text-medium-emphasis">Backup folder</div>
        <v-text-field
          placeholder="Backup folder"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-folder"
          hide-details="auto"
          v-model="data.backupDir"
          :error-messages="errors.backupDir"
          :loading="loading"
          color="orange"
        ></v-text-field>
      </v-col>
    </v-row>
  </v-form>
</template>
<script setup lang="ts">
import { WebdavEndpointType, type WebdavConfig } from "@/types/webdavConfig";
import { getWebdavConfig, saveWebdavConfig } from "@/services/configService";
import { ref } from "vue";
import { useConfigForm } from "@/composable/ConfigForm";

const items = [
  {
    title: "Nextcloud",
    value: WebdavEndpointType.NEXTCLOUD,
  },
  {
    title: "Custom",
    value: WebdavEndpointType.CUSTOM,
  },
];

const errors = ref({
  url: [],
  username: [],
  password: [],
  backupDir: [],
  allowSelfSignedCerts: [],
  type: [],
  customEndpoint: [],
  customChunkEndpoint: [],
  chunckedUpload: [],
});

const data = ref<WebdavConfig>({
  url: "",
  allowSelfSignedCerts: false,
  backupDir: "",
  username: "",
  password: "",
  chunckedUpload: false,
  webdavEndpoint: {
    type: WebdavEndpointType.NEXTCLOUD,
  },
});

const emit = defineEmits<{
  (e: "success"): void;
  (e: "fail"): void;
  (e: "loaded"): void;
  (e: "loading"): void;
}>();

function loadData() {
  return getWebdavConfig().then((value) => {
    data.value = value;
    return data;
  });
}

const { save, loading } = useConfigForm(
  saveWebdavConfig,
  loadData,
  data,
  errors,
  emit
);
defineExpose({ save });
</script>
