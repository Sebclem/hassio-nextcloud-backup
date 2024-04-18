<template>
  <v-app>
    <navbar-component></navbar-component>
    <message-bar></message-bar>
    <webdav-config-menu @saved="cloudList?.refreshBackup"></webdav-config-menu>
    <backup-config-menu></backup-config-menu>
    <alert-manager></alert-manager>
    <v-main class="mx-12">
      <v-row>
        <v-col cols="4" offset="1">
          <status-component></status-component>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <ha-list></ha-list>
        </v-col>
        <v-col cols="6">
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
import MessageBar from "./components/MessageBar.vue";
import NavbarComponent from "./components/NavbarComponent.vue";
import BackupConfigMenu from "./components/settings/BackupConfigMenu.vue";
import WebdavConfigMenu from "./components/settings/WebdavConfigMenu.vue";
import StatusComponent from "./components/StatusComponent.vue";
const cloudList = ref<InstanceType<typeof CloudList> | null>(null);
</script>

<style scoped></style>
