<template>
  <v-menu activator="parent" :close-on-content-click="false">
    <v-sheet width="500" border rounded>
      <v-toolbar color="surface" density="comfortable" border>
        <v-toolbar-title>Messages</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="markAllReaded">
          <v-icon color="success">mdi-check-all</v-icon>
        </v-btn>
      </v-toolbar>
      <v-divider></v-divider>
      <v-responsive max-height="350px" class="overflow-y-auto">
        <v-list class="py-0">
          <v-data-iterator
            :items="messages"
            item-value="id"
            items-per-page="-1"
          >
            <template v-slot:default="{ items, isExpanded, toggleExpand }">
              <template v-for="(item, index) in items" :key="item.raw.id">
                <v-divider v-if="index != 0"></v-divider>
                <v-list-item :class="{ 'bg-brown-darken-4': !item.raw.viewed }">
                  <v-list-item-title>
                    {{ item.raw.message }}
                  </v-list-item-title>
                  <template v-slot:prepend>
                    <v-icon
                      :icon="getMessageIcon(item.raw.type)"
                      :color="getMessageColor(item.raw.type)"
                      class="mr-3"
                    ></v-icon>
                  </template>
                  <template v-slot:append>
                    <v-btn
                      v-if="item.raw.detail"
                      variant="text"
                      icon
                      color="secondary"
                      @click="toggleExpand(item as any)"
                      size="small"
                    >
                      <v-icon>
                        {{
                          isExpanded(item as any)
                            ? "mdi-chevron-up"
                            : "mdi-information"
                        }}
                      </v-icon>
                    </v-btn>
                    <v-scroll-x-transition>
                      <v-btn
                        color="success"
                        variant="text"
                        @click="markReaded(item.raw.id)"
                        icon
                        v-show="!item.raw.viewed"
                        size="small"
                      >
                        <v-icon>mdi-check</v-icon>
                      </v-btn>
                    </v-scroll-x-transition>

                    <div class="text-caption text-disabled ml-1">
                      {{ getTimeDelta(item.raw.time) }}
                    </div>
                  </template>
                </v-list-item>
                <v-expand-transition v-if="item.raw.detail">
                  <div v-if="isExpanded(item as any)">
                    <v-divider class="mx-3"></v-divider>
                    <v-card
                      class="mx-3 my-2"
                      variant="outlined"
                      color="secondary"
                    >
                      <v-card-text>
                        {{ item.raw.detail }}
                      </v-card-text>
                    </v-card>
                  </div>
                </v-expand-transition>
              </template>
            </template>
          </v-data-iterator>
        </v-list>
      </v-responsive>
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
import * as messageService from "@/services/messageService";
import { useMessageStore } from "@/store/message";
import { MessageType } from "@/types/messages";
import { DateTime } from "luxon";
import { storeToRefs } from "pinia";
import { onBeforeUnmount } from "vue";

const messagesStore = useMessageStore();
const { messages } = storeToRefs(messagesStore);

const interval = setInterval(refreshMessages, 2000);

function refreshMessages() {
  messageService.getMessages().then((values) => {
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
refreshMessages();

function markReaded(id: string) {
  messageService.markRead(id).then((values) => {
    messages.value = values;
  });
}

function markAllReaded() {
  messageService.markAllRead().then((value) => {
    messages.value = value;
  });
}

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>
