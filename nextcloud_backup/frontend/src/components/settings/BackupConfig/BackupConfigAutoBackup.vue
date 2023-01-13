<template>
  <v-card variant="elevated" elevation="7">
    <v-card-title class="bg-light-blue-darken-4">
      <v-row dense>
        <v-col cols="10" offset="1" class="text-center text-white">
          Auto Backup
        </v-col>
        <v-col cols="1">
          <v-btn
            class="float-right"
            size="32"
            color="green"
            rounded
            @click="backupConfigStore.addEmptyCron()"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text class="pa-0 bg-blue-grey-darken-4">
      <v-expansion-panels variant="inset" v-model="expansionPanelModel">
        <v-expansion-panel v-for="cron in data.cron" :key="cron.id">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              {{ CronModeFriendly[cron.mode] }}
              <v-spacer></v-spacer>
              <v-fade-transition>
                <v-chip
                  v-if="!expanded && cron.monthDay != undefined"
                  append-icon="mdi-calendar"
                  size="small"
                >
                  {{ cron.monthDay }}
                </v-chip>
              </v-fade-transition>
              <v-fade-transition>
                <v-chip
                  v-if="!expanded && cron.weekday != undefined"
                  append-icon="mdi-calendar"
                  size="small"
                  class="ml-3"
                >
                  {{ weekdayFriendly[cron.weekday] }}
                </v-chip>
              </v-fade-transition>
              <v-fade-transition>
                <v-chip
                  v-if="!expanded && cron.hour"
                  append-icon="mdi-clock"
                  size="small"
                  class="mx-3"
                >
                  {{ cron.hour }}
                </v-chip>
              </v-fade-transition>
              <v-fade-transition>
                <v-chip
                  v-if="!expanded && cron.custom"
                  append-icon="mdi-clock-edit"
                  size="small"
                  class="mx-3"
                  >{{ cron.custom }}</v-chip
                >
              </v-fade-transition>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row dense>
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Mode <v-icon class="float-right">mdi-cog</v-icon>
                </div>
                <v-select
                  :items="
                    Object.entries(CronMode).map((value) => {
                      return { title: value[0], value: value[1] };
                    })
                  "
                  v-model="cron.mode"
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                >
                </v-select>
              </v-col>
            </v-row>
            <v-row v-if="cron.mode == CronMode.Weekly" dense>
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Day of week <v-icon class="float-right">mdi-calendar</v-icon>
                </div>
                <v-select
                  v-model="cron.weekday"
                  :items="
                    weekdayFriendly.map((value, index) => {
                      return { title: value, value: index };
                    })
                  "
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                ></v-select>
              </v-col>
            </v-row>
            <v-row v-if="cron.mode == CronMode.Monthly" dense>
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Day of month <v-icon class="float-right">mdi-calendar</v-icon>
                </div>
                <v-text-field
                  v-model="cron.monthDay"
                  type="number"
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                  min="1"
                  max="28"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row v-if="cron.mode != CronMode.Custom" dense>
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Hour <v-icon class="float-right">mdi-clock</v-icon>
                </div>
                <v-text-field
                  v-model="cron.hour"
                  type="time"
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row v-if="cron.mode == CronMode.Custom" dense>
              <v-col>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Custom CRON
                  <v-icon class="float-right">mdi-clock-edit</v-icon>
                </div>
                <v-text-field
                  v-model="cron.custom"
                  hide-details="auto"
                  density="compact"
                  variant="outlined"
                  color="orange"
                  min="1"
                  max="28"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col align-self="center" class="text-center">
                <v-btn color="red" @click="removeCron(cron.id)"
                  ><v-icon>mdi-trash-can</v-icon></v-btn
                >
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <div
          v-if="data.cron?.length == 0"
          class="my-3 text-subtitle-2 text-medium-emphasis"
        >
          No auto backup configured
        </div>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useBackupConfigStore } from "@/stores/backupConfig";
import {
  CronMode,
  CronModeFriendly,
  weekdayFriendly,
} from "@/types/backupConfig";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const expansionPanelModel = ref(undefined);

defineProps<{ loading: boolean }>();
const backupConfigStore = useBackupConfigStore();

function removeCron(id: string) {
  expansionPanelModel.value = undefined;
  backupConfigStore.removeCron(id);
}

const { data } = storeToRefs(backupConfigStore);
</script>

<style scoped></style>
