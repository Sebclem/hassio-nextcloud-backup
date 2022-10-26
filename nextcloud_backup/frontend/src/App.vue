<template>
  <v-app>
    <navbar-component></navbar-component>
    <message-bar></message-bar>
    <webdav-settings-menu></webdav-settings-menu>
    <v-main> </v-main>
  </v-app>
</template>

<script setup lang="ts">
import NavbarComponent from "./components/NavbarComponent.vue";
import MessageBar from "./components/MessageBar.vue";
import WebdavSettingsMenu from "./components/settings/WebdavConfigMenu.vue";
</script>

<style scoped></style>
