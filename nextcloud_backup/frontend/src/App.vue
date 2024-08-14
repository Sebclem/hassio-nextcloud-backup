<template>
  <v-app>
    <navbar-component></navbar-component>
    <webdav-config-menu @saved="cloudList?.refreshBackup"></webdav-config-menu>
    <backup-config-menu></backup-config-menu>
    <alert-manager></alert-manager>
    <v-main class="mx-xl-16 mx-lg-10 mx-2">
      <StatusBar @state-updated="refreshLists"></StatusBar>
      <v-row>
        <v-col cols="12" lg="6">
          <ha-list ref="haList"></ha-list>
        </v-col>
        <v-col cols="12" lg="6">
          <cloud-list ref="cloudList"></cloud-list>
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AlertManager from "./components/AlertManager.vue";
import CloudList from "./components/cloud/CloudList.vue";
import HaList from "./components/homeAssistant/HaList.vue";
import NavbarComponent from "./components/NavbarComponent.vue";
import BackupConfigMenu from "./components/settings/BackupConfigMenu.vue";
import WebdavConfigMenu from "./components/settings/WebdavConfigMenu.vue";
import StatusBar from "./components/statusBar/StatusBar.vue";
const cloudList = ref<InstanceType<typeof CloudList> | null>(null);
const haList = ref<InstanceType<typeof HaList> | null>(null);

function refreshLists() {
  cloudList.value?.refreshBackup();
  haList.value?.refreshBackup();
}
</script>

<style scoped></style>

