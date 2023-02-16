<template>
  <v-list-item :title="name" rounded>
    <template v-slot:append v-if="version">
      <div class="text-secondary">{{ version }}</div>
    </template>
  </v-list-item>
  <v-divider></v-divider>
</template>

<script setup lang="ts">

const props = defineProps<{
  name: string;
  version?: string;
}>();
</script>
