<template>
  <v-card border elevation="10">
    <v-card-item>
      <v-card-title class="text-center">Status</v-card-title>
    </v-card-item>
    <v-divider class="border-opacity-25"></v-divider>
    <v-card-text class="h-auto">
      <v-row align-content="space-around">
        <v-col xl="6" lg="12" sm="6" cols="12">
          <div class="h-100 d-flex align-center">
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
          </div>
        </v-col>
        <v-divider vertical class="border-opacity-25 my-n1 d-xl-inline-flex d-sm-inline-flex d-lg-none d-none"></v-divider>
        <v-col xl="6" lg="12" sm="6" cols="12">
          <div class="h-100 d-flex align-center">
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
                    ? DateTime.fromISO(status.webdav.last_check).toLocaleString(
                        DateTime.DATETIME_MED
                      )
                    : "UNKNOWN"
                }}
              </p>
            </v-tooltip>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Status } from "@/types/status";
import { DateTime } from "luxon";
import { computed } from "vue";

const props = defineProps<{
  status?: Status;
}>();

const webdavProps = computed(() => {
  if (
    props.status?.webdav.logged_in == undefined ||
    props.status?.webdav.folder_created == undefined
  ) {
    return { icon: "mdi-help-circle", text: "Unknown", color: "" };
  } else if (
    props.status?.webdav.logged_in &&
    props.status?.webdav.folder_created
  ) {
    return { icon: "mdi-check", text: "Ok", color: "green" };
  } else {
    return { icon: "mdi-alert", text: "Fail", color: "red" };
  }
});

const webdavLoggedProps = computed(() => {
  if (props.status?.webdav.logged_in) {
    return { text: "Ok", color: "green" };
  } else {
    return { text: "Fail", color: "red" };
  }
});

const webdavFolderProps = computed(() => {
  if (props.status?.webdav.folder_created) {
    return { text: "Ok", color: "green" };
  } else {
    return { text: "Fail", color: "red" };
  }
});

const hassProps = computed(() => {
  if (props.status?.hass.ok == undefined) {
    return { icon: "mdi-help-circle", text: "Unknown", color: "" };
  } else if (props.status?.hass.ok) {
    return { icon: "mdi-check", text: "Ok", color: "green" };
  } else {
    return { icon: "mdi-alert", text: "Fail", color: "red" };
  }
});
</script>
