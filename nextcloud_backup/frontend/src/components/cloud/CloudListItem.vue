<template>
  <v-divider v-if="index != 0" color="grey-darken-3"></v-divider>
  <v-list-item class="bg-grey-darken-3">
    <v-list-item-title>{{ item.name }}</v-list-item-title>
    <template v-slot:append>
      <v-scroll-x-transition>
        <v-chip
          color="primary"
          variant="flat"
          size="small"
          class="mr-1"
          v-show="!detail"
        >
          {{
            DateTime.fromISO(item.lastEdit).toLocaleString(
              DateTime.DATETIME_MED
            )
          }}
        </v-chip>
      </v-scroll-x-transition>

      <v-btn variant="text" icon color="success" @click="detail = !detail">
        <v-icon>{{ detail ? "mdi-chevron-up" : "mdi-information" }}</v-icon>
      </v-btn>
    </template>
  </v-list-item>
  <v-expand-transition>
    <v-card v-show="detail" variant="tonal" color="secondary" rounded="0">
      <v-card-text>
        <v-row>
          <v-col class="d-flex justify-center">
            <v-tooltip text="Creation" location="top">
              <template v-slot:activator="{ props }">
                <v-chip
                  color="primary"
                  variant="flat"
                  class="mr-2"
                  label
                  v-bind="props"
                >
                  <v-icon start icon="mdi-folder-plus"></v-icon>
                  {{
                    item.creationDate
                      ? DateTime.fromISO(item.creationDate).toLocaleString(
                          DateTime.DATETIME_MED
                        )
                      : "UNKNOWN"
                  }}
                </v-chip>
              </template>
            </v-tooltip>
            <v-tooltip text="Home Assistant Version" location="top">
              <template v-slot:activator="{ props }">
                <v-chip color="success" variant="flat" label v-bind="props">
                  <v-icon start icon="mdi-home-assistant"></v-icon>
                  {{ item.haVersion ? item.haVersion : "UNKNOWN" }}
                </v-chip>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="d-flex justify-center">
            <v-tooltip text="Last edit" location="top">
              <template v-slot:activator="{ props }">
                <v-chip
                  color="primary"
                  variant="flat"
                  class="mr-2"
                  label
                  v-bind="props"
                >
                  <v-icon start icon="mdi-pencil"></v-icon>
                  {{
                    DateTime.fromISO(item.lastEdit).toLocaleString(
                      DateTime.DATETIME_MED
                    )
                  }}
                </v-chip>
              </template>
            </v-tooltip>
            <v-tooltip text="Size" location="top">
              <template v-slot:activator="{ props }">
                <v-chip color="success" variant="flat" label v-bind="props">
                  <v-icon start icon="mdi-database"></v-icon>
                  {{ prettyBytes(item.size) }}
                </v-chip>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider class="mx-4"></v-divider>
      <v-card-actions class="justify-center">
        <v-tooltip text="Upload to Home Assitant" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" color="success" v-bind="props">
              <v-icon>mdi-upload</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-btn variant="outlined" color="red" @click="emits('delete', item)">
          <v-icon>mdi-trash-can</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-expand-transition>
</template>

<script setup lang="ts">
import type { WebdavBackup } from "@/types/webdav";
import { DateTime } from "luxon";
import prettyBytes from "pretty-bytes";
import { ref } from "vue";

const detail = ref(false);
defineProps<{
  item: WebdavBackup;
  index: number;
}>();

const emits = defineEmits<{
  (e: "delete", item: WebdavBackup): void;
}>();
</script>
