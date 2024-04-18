<template>
  <div>
    <v-card class="mt-5" border elevation="10">
      <v-card-title class="text-center">Status</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <v-card variant="elevated" border>
              <v-card-text class="align-center d-flex justify-center">
                <span class="me-auto">Home Assistant</span>
                <v-tooltip content-class="bg-black">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      v-bind="props"
                      variant="elevated"
                      :prepend-icon="hassProps.icon"
                      :color="hassProps.color"
                      :text="hassProps.text"
                    >
                    </v-chip>
                  </template>
                  Last check:
                  {{
                    status?.hass.last_check
                      ? DateTime.fromISO(status.hass.last_check).toLocaleString(
                          DateTime.DATETIME_MED
                        )
                      : "UNKNOWN"
                  }}
                </v-tooltip>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card variant="elevated" border>
              <v-card-text class="align-center d-flex justify-center">
                <span class="me-auto">Cloud</span>
                <v-tooltip content-class="bg-black">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      v-bind="props"
                      variant="elevated"
                      :prepend-icon="webdavProps.icon"
                      :color="webdavProps.color"
                      :text="webdavProps.text"
                    >
                    </v-chip>
                  </template>
                  <span>Login: </span>
                  <span :class="'text-' + webdavLoggedProps.color">
                    {{ webdavLoggedProps.text }}
                  </span>
                  <br />
                  <span>Folder: </span>
                  <span :class="'text-' + webdavFolderProps.color">
                    {{ webdavFolderProps.text }}
                  </span>
                  <p>
                    Last check:
                    {{
                      status?.webdav.last_check
                        ? DateTime.fromISO(
                            status.webdav.last_check
                          ).toLocaleString(DateTime.DATETIME_MED)
                        : "UNKNOWN"
                    }}
                  </p>
                </v-tooltip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getStatus } from "@/services/statusService";
import { Status } from "@/types/status";
import { computed, ref, onBeforeUnmount } from "vue";
import { DateTime } from "luxon";

const status = ref<Status | undefined>(undefined);

function refreshStatus() {
  getStatus().then((data) => {
    status.value = data;
  });
}

const webdavProps = computed(() => {
  if (status.value?.webdav.logged_in && status.value?.webdav.folder_created) {
    return { icon: "mdi-check", text: "Ok", color: "green" };
  } else {
    return { icon: "mdi-alert", text: "Fail", color: "red" };
  }
});

const webdavLoggedProps = computed(() => {
  if (status.value?.webdav.logged_in) {
    return { text: "Ok", color: "green" };
  } else {
    return { text: "Fail", color: "red" };
  }
});

const webdavFolderProps = computed(() => {
  if (status.value?.webdav.folder_created) {
    return { text: "Ok", color: "green" };
  } else {
    return { text: "Fail", color: "red" };
  }
});

const hassProps = computed(() => {
  if (status.value?.hass.ok) {
    return { icon: "mdi-check", text: "Ok", color: "green" };
  } else {
    return { icon: "mdi-alert", text: "Fail", color: "red" };
  }
});

refreshStatus();
const interval = setInterval(refreshStatus, 2000);
onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
