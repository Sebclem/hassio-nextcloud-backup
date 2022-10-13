<template>
  <v-app>
    <v-main>
      <navbar-component></navbar-component>
      <message-bar></message-bar>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import NavbarComponent from "./components/NavbarComponent.vue";
import MessageBar from "./components/MessageBar.vue";
</script>

<style scoped></style>
