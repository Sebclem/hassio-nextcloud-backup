<template>
  <v-card border>
    <v-card-title class="text-center">Action</v-card-title>
    <v-divider class="border-opacity-25"></v-divider>
    <v-card-text>
      <v-btn color="success" @click="launchBackup">Backup Now</v-btn>
      <v-btn color="success" @click="launchClean">Clean</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { backupNow, clean } from "@/services/actionService";
import { useAlertStore } from "@/store/alert";

const alertStore = useAlertStore();

function launchBackup() {
  backupNow()
    .then(() => {
      alertStore.add("success", "Backup workflow started !");
    })
    .catch(() => {
      alertStore.add("error", "Fail to start backup workflow !");
    });
}

function launchClean() {
  clean()
    .then(() => {
      alertStore.add("success", "Backup workflow started !");
    })
    .catch(() => {
      alertStore.add("error", "Fail to start backup workflow !");
    });
}
</script>
