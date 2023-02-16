<template>
  <v-divider v-if="index != 0" color="grey-darken-3"></v-divider>
  <v-list-item class="bg-grey-darken-3">
    <v-list-item-title>{{ item.name }}</v-list-item-title>
    <template v-slot:append>
      <v-scroll-x-transition>
        <div v-if="!detail">
          <v-chip color="primary" variant="flat" size="small" class="mr-2">
            {{ item.type == "partial" ? "P" : "F" }}
          </v-chip>
          <v-chip color="primary" variant="flat" size="small" class="mr-1">
            {{
              DateTime.fromISO(item.date).toLocaleString(DateTime.DATETIME_MED)
            }}
          </v-chip>
        </div>
      </v-scroll-x-transition>
      <v-btn variant="text" icon color="success" @click="detail = !detail">
        <v-icon>{{ detail ? "mdi-chevron-up" : "mdi-information" }}</v-icon>
      </v-btn>
    </template>
  </v-list-item>
  <v-expand-transition>
    <v-card v-show="detail" variant="tonal" color="secondary" rounded="0">
      <v-card-text>
        <v-row v-if="!detailData">
          <v-col class="text-center">
            <v-progress-circular indeterminate></v-progress-circular>
          </v-col>
        </v-row>
        <template v-if="detailData">
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
                      DateTime.fromISO(detailData.date).toLocaleString(
                        DateTime.DATETIME_MED
                      )
                    }}
                  </v-chip>
                </template>
              </v-tooltip>
              <v-tooltip text="Home Assistant Version" location="top">
                <template v-slot:activator="{ props }">
                  <v-chip color="success" variant="flat" label v-bind="props">
                    <v-icon start icon="mdi-home-assistant"></v-icon>
                    {{ detailData.homeassistant }}
                  </v-chip>
                </template>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col class="d-flex justify-center">
              <v-tooltip text="Password protection" location="top">
                <template v-slot:activator="{ props }">
                  <v-chip
                    :color="detailData.protected ? 'success' : 'primary'"
                    variant="flat"
                    class="mr-2"
                    label
                    v-bind="props"
                  >
                    <v-icon
                      start
                      :icon="
                        detailData.protected ? 'mdi-lock' : 'mdi-lock-open'
                      "
                    ></v-icon>
                    {{ detailData.protected ? "Protected" : "Unprotected" }}
                  </v-chip>
                </template>
              </v-tooltip>
              <v-tooltip text="Size" location="top">
                <template v-slot:activator="{ props }">
                  <v-chip
                    color="success"
                    variant="flat"
                    class="mr-2"
                    label
                    v-bind="props"
                  >
                    <v-icon start icon="mdi-database"></v-icon>
                    {{ detailData.size }} MB
                  </v-chip>
                </template>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col class="d-flex justify-center">
              <v-tooltip text="Backup Type" location="top">
                <template v-slot:activator="{ props }">
                  <v-chip color="success" variant="flat" label v-bind="props">
                    <v-icon
                      start
                      :icon="
                        detailData.type == 'full'
                          ? 'mdi-alpha-f-box'
                          : 'mdi-alpha-p-box'
                      "
                    ></v-icon>
                    {{ detailData.type }}
                  </v-chip>
                </template>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex justify-center text-white">
              <h3>Content</h3>
            </v-col>
          </v-row>
          <v-divider class="mt-2"></v-divider>
          <v-row>
            <v-col cols="12" lg="6">
              <div class="text-center text-white mt-2">
                <h3>Folders</h3>
              </div>
              <v-list density="compact" variant="tonal">
                <ha-list-item-content
                  v-for="item of detailData.folders.sort()"
                  :name="item"
                  v-bind:key="item"
                ></ha-list-item-content>
              </v-list>
            </v-col>
            <v-col>
              <div class="text-center text-white mt-2">
                <h3>Addons</h3>
              </div>
              <v-list density="compact" variant="tonal">
                <ha-list-item-content
                  v-for="item of detailData.addons.sort((a, b) =>
                    a.name.localeCompare(b.name)
                  )"
                  :name="item.name"
                  v-bind:key="item.slug"
                  :version="item.version"
                ></ha-list-item-content>
              </v-list>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
      <v-divider class="mx-4"></v-divider>
      <v-card-actions class="justify-center">
        <v-tooltip text="Upload to Cloud" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" color="success" v-bind="props">
              <v-icon>mdi-cloud-upload</v-icon>
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
import { getBackupDetail } from "@/services/homeAssistantService";
import type { BackupDetailModel, BackupModel } from "@/types/homeAssistant";
import { DateTime } from "luxon";
import { ref, watch } from "vue";
import HaListItemContent from "./HaListItemContent.vue";

const detail = ref(false);
const detailData = ref<BackupDetailModel | null>(null);
const props = defineProps<{
  item: BackupModel;
  index: number;
}>();

watch(detail, (value) => {
  if (value) {
    getBackupDetail(props.item.slug).then((response) => {
      detailData.value = response;
    });
  }
});

const emits = defineEmits<{
  (e: "delete", item: BackupModel): void;
}>();
</script>
