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
    <v-btn icon id="message-btn" >
      <v-badge color="error" :content="countUnreadMessages">
        <v-icon :class="{ shake: haveUnreadMessages }">mdi-bell</v-icon>
      </v-badge>
    </v-btn>
    <v-menu width="210px">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          title="Cloud settings"
          @click="dialogStatusStore.webdav = true"
          prepend-icon="mdi-cloud"
        ></v-list-item>
        <v-list-item
          title="Backup settings"
          prepend-icon="mdi-rotate-left"
          @click="dialogStatusStore.backup = true"
        ></v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useDialogStatusStore } from "@/stores/dialogStatus";
import { useMessageStore } from "@/stores/message";
import { storeToRefs } from "pinia";
import logoUrl from "../assets/logo.svg";

const dialogStatusStore = useDialogStatusStore();
const messagesStore = useMessageStore();
const { haveUnreadMessages, countUnreadMessages } = storeToRefs(messagesStore);
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
