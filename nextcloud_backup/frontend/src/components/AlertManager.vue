<template>
  <v-fade-transition>
    <div id="parent" v-if="alertVisible">
      <div id="alertContainer">
        <v-slide-x-transition group tag="div">
          <v-alert
            v-for="alert of alertList"
            v-bind:key="alert.id"
            elevation="24"
            :type="alert.type"
            border="start"
            class="mb-2"
          >
            <v-row dense>
              <v-col v-html="alert.message"></v-col>
              <v-col cols="2">
                <v-btn
                  class="d-inline"
                  size="30"
                  variant="text"
                  rounded
                  icon="$close"
                  @click="alertStore.remove(alert.id)"
                ></v-btn>
              </v-col>
            </v-row>

            <!-- @vue-ignore -->
            <v-progress-linear
              :max="alertStore.timeOutValue"
              :model-value="alert.timeOut as any"
            ></v-progress-linear>
          </v-alert>
        </v-slide-x-transition>
      </div>
    </div>
  </v-fade-transition>
</template>
<script lang="ts" setup>
import { useAlertStore } from "@/store/alert";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const alertStore = useAlertStore();

const { alertList } = storeToRefs(alertStore);

const alertVisible = computed(() => alertList.value.length > 0);
</script>
<style>
#parent {
  position: absolute;
  top: 70px;
  right: 20px;
  z-index: 99999;
  height: 100vh;
  pointer-events: none;
  #alertContainer {
    position: sticky;
    pointer-events: all;
    top: 80px;
    right: 20px;
  }
}
</style>
