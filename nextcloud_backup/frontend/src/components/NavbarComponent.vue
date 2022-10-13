<template>
  <v-app-bar class="bg-primary">
    <v-app-bar-title>
      <div class="d-flex flex-row align-center">
        <div>
          <v-img :src="logoUrl" width="80"></v-img>
        </div>
        <h4>Nextcloud Backup</h4>
      </div>
    </v-app-bar-title>
    <v-spacer></v-spacer>
    <v-btn icon id="message-btn">
      <v-icon>mdi-bell</v-icon>
    </v-btn>
    <v-btn icon @click="emit('settingClick')">
      <v-icon>mdi-cog</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
import logoUrl from "../assets/logo.svg";

const emit = defineEmits<{
  (e: "settingClick"): void;
  (e: "notificationClick"): void;
}>();
</script>
<style scoped>
.shake {
  animation: shake 1.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both infinite;
  transform: rotate(0deg);
}
@keyframes shake {
  20% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(10deg);
  }
  30% {
    transform: rotate(0deg);
  }
  35% {
    transform: rotate(-10deg);
  }
  40% {
    transform: rotate(0eg);
  }
  45% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(0deg);
  }
  55% {
    transform: rotate(-10deg);
  }
  60% {
    transform: rotate(0deg);
  }
}
</style>
