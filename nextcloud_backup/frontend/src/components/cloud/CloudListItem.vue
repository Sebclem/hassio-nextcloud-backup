<template>
  <v-divider v-if="index != 0" color="grey-darken-3"></v-divider>
  <v-list-item>
    <v-list-item-title class="text-deep-orange-darken-3">{{
      item.name
    }}</v-list-item-title>
    <template v-slot:append>
      <v-scroll-x-transition>
        <v-chip
          color="primary"
          variant="flat"
          size="small"
          class="mr-2"
          v-show="!detail"
        >
          {{
            DateTime.fromISO(item.lastEdit).toLocaleString(
              DateTime.DATETIME_SHORT
            )
          }}
        </v-chip>
      </v-scroll-x-transition>

      <v-btn variant="text" icon color="secondary" @click="detail = !detail">
        <v-icon>{{ detail ? "mdi-chevron-up" : "mdi-information" }}</v-icon>
      </v-btn>
    </template>
  </v-list-item>
  <v-expand-transition>
    <v-card v-show="detail" variant="tonal" color="secondary" rounded="0">
      <v-card-text class="d-flex justify-center">
        <v-chip color="primary" variant="flat" class="mr-2" label>
          <v-icon start icon="mdi-pencil"></v-icon>
          {{
            DateTime.fromISO(item.lastEdit).toLocaleString(
              DateTime.DATETIME_SHORT
            )
          }}
        </v-chip>
        <v-chip color="success" variant="flat" label>
          <v-icon start icon="mdi-database"></v-icon>
          {{ prettyBytes(item.size) }}
        </v-chip>
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
        <v-btn variant="outlined" color="red">
          <v-icon>mdi-trash-can</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-expand-transition>
</template>

<script setup lang="ts">
import type { WebdavBackup } from "@/types/webdav";
import prettyBytes from "pretty-bytes";
import { DateTime } from "luxon";
import { ref } from "vue";

const detail = ref(false);
defineProps<{
  item: WebdavBackup;
  index: number;
}>();
</script>
