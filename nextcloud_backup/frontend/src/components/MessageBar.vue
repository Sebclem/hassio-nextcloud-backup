<template>
  <v-menu activator="#message-btn" :close-on-content-click="false">
    <v-sheet width="500" border rounded>
      <v-toolbar color="surface" density="compact">
        <div class="d-flex justify-center w-100">
          <h4>Messages</h4>
        </div>
      </v-toolbar>
      <v-divider></v-divider>
      <v-responsive max-height="350px" class="overflow-y-auto">
        <v-list class="py-0">
          <template v-for="(item, index) in messages" :key="item.id">
            <v-divider v-if="index != 0"></v-divider>
            <v-list-item :class="{ 'bg-brown-darken-4': !item.viewed }">
              <v-list-item-title>
                {{ item.message }}
              </v-list-item-title>
              <template v-slot:prepend>
                <v-icon
                  :icon="getMessageIcon(item.type)"
                  :color="getMessageColor(item.type)"
                  class="mr-3"
                ></v-icon>
              </template>
              <template v-slot:append>
                <v-btn
                  v-if="item.detail"
                  variant="text"
                  icon
                  color="secondary"
                  @click="show[index] = show[index] ? false : true"
                  size="small"
                >
                  <v-icon>mdi-information</v-icon>
                </v-btn>
                <v-btn
                  color="success"
                  variant="text"
                  @click.stop
                  icon
                  v-if="!item.viewed"
                  size="small"
                >
                  <v-icon>mdi-check</v-icon>
                </v-btn>
                <div class="text-caption text-disabled ml-1">
                  {{ getTimeDelta(item.time) }}
                </div>
              </template>
            </v-list-item>
            <v-expand-transition v-if="item.detail">
              <div v-show="show[index]">
                <v-divider class="mx-3"></v-divider>
                <v-card class="mx-3 my-2" variant="outlined" color="secondary">
                  <v-card-text>
                    {{ item.detail }}
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>
          </template>
        </v-list>
      </v-responsive>
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
import { getMessages } from "@/services/messageService";
import { MessageType, type Message } from "@/types/messages";
import { DateTime } from "luxon";
import { onBeforeUnmount, ref } from "vue";

const messages = ref<Message[]>([]);

const interval = setInterval(refreshMessages, 1000);

function refreshMessages() {
  getMessages().then((values) => {
    messages.value = values;
  });
}

function getMessageColor(messageType: MessageType) {
  switch (messageType) {
    case MessageType.ERROR:
      return "red";
    case MessageType.WARN:
      return "yellow";
    case MessageType.INFO:
      return "primary";
    case MessageType.SUCCESS:
      return "success";
  }
}

function getMessageIcon(messageType: MessageType) {
  switch (messageType) {
    case MessageType.ERROR:
      return "mdi-alert-octagram";
    case MessageType.WARN:
      return "mdi-alert";
    case MessageType.INFO:
      return "mdi-alert-circle";
    case MessageType.SUCCESS:
      return "mdi-check-circle";
  }
}

function getTimeDelta(time: string) {
  let duration = DateTime.now().diff(DateTime.fromISO(time), ["seconds"]);
  if (duration.seconds < 60) {
    return duration.toHuman({
      maximumFractionDigits: 0,
      unitDisplay: "short",
    } as any);
  }
  duration = duration.shiftTo("minutes");
  if (duration.minutes < 60) {
    return duration.toHuman({
      maximumFractionDigits: 0,
      unitDisplay: "short",
    } as any);
  }

  duration = duration.shiftTo("hours");
  if (duration.hours < 24) {
    return duration.toHuman({
      maximumFractionDigits: 0,
      unitDisplay: "short",
    } as any);
  } else {
    return duration.shiftTo("days").toHuman({
      maximumFractionDigits: 0,
      unitDisplay: "short",
    } as any);
  }
}
const show = ref<boolean[]>([]);
refreshMessages();

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
