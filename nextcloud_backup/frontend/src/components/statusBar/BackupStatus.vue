<template>
  <v-card border>
    <v-card-item>
      <v-card-title class="text-center">Backup</v-card-title>
    </v-card-item>
    <v-divider class="border-opacity-25"></v-divider>
    <v-card-text>
      <v-row>
        <v-col xl="6" lg="12" sm="6" cols="12">
          <div class="h-100 d-flex align-center">
            <span class="me-auto">Last</span>
            <v-tooltip content-class="bg-black">
              <template v-slot:activator="{ props }">
                <v-chip
                  v-bind="props"
                  variant="elevated"
                  :prepend-icon="lastBackupProps.icon"
                  :color="lastBackupProps.color"
                  :text="lastBackupProps.text"
                >
                </v-chip>
              </template>
              <p>
                Last try:
                {{
                  status?.last_backup.last_try
                    ? DateTime.fromISO(
                        status?.last_backup.last_try
                      ).toLocaleString(DateTime.DATETIME_MED)
                    : "Unknown"
                }}
              </p>
              <p>
                Last success:
                {{
                  status?.last_backup.last_success
                    ? DateTime.fromISO(
                        status?.last_backup.last_success
                      ).toLocaleString(DateTime.DATETIME_MED)
                    : "Unknown"
                }}
              </p>
            </v-tooltip>
          </div>
        </v-col>
        <v-divider vertical class="border-opacity-25 mt-n1"></v-divider>
        <v-col xl="6" lg="12" sm="6" cols="12">
          <div class="h-100 d-flex align-center">
            <span class="me-auto">Next</span>
            <v-chip
              variant="elevated"
              color="success"
              prepend-icon="mdi-update"
            >
              {{
                status?.next_backup
                  ? DateTime.fromISO(status?.next_backup).toLocaleString(
                      DateTime.DATETIME_MED
                    )
                  : "Unknown"
              }}
            </v-chip>
          </div>
        </v-col>
      </v-row>
      <v-row v-if="status?.status != States.IDLE">
        <v-divider class="border-opacity-25 mx-n1"></v-divider>
      </v-row>
      <v-row v-if="status?.status != States.IDLE">
        <v-col>
          <v-progress-linear
            height="25"
            :model-value="percent"
            :indeterminate="indeterminate"
            class=""
            color="success"
            rounded
          >
            <strong>{{ status?.status }}</strong>
          </v-progress-linear>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { States, Status } from "@/types/status";
import { DateTime } from "luxon";
import { computed } from "vue";

const props = defineProps<{
  status?: Status;
}>();

const percent = computed(() => {
  if (props.status?.status == States.IDLE || !props.status?.progress) {
    return 0;
  } else {
    return props.status.progress * 100;
  }
});

const lastBackupProps = computed(() => {
  if (props.status?.last_backup.success == undefined) {
    return { icon: "mdi-help-circle", text: "Unknown", color: "" };
  } else if (props.status?.last_backup.success) {
    return { icon: "mdi-check", text: "Success", color: "green" };
  } else {
    return { icon: "mdi-alert", text: "Fail", color: "red" };
  }
});

const indeterminate = computed(()=> {
  return props.status?.progress == -1 && props.status.status != States.IDLE
})
</script>
