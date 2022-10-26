<template>
  <v-app>
    <navbar-component></navbar-component>
    <message-bar></message-bar>
    <webdav-settings-menu></webdav-settings-menu>
    <v-main class="mx-12"> 
      <v-row>
        <v-col cols="6" offset="6">
          <cloud-list></cloud-list>
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import NavbarComponent from "./components/NavbarComponent.vue";
import MessageBar from "./components/MessageBar.vue";
import WebdavSettingsMenu from "./components/settings/WebdavConfigMenu.vue";
import CloudList from "./components/cloud/CloudList.vue";
</script>

<style scoped></style>
