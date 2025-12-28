<template>
  <div class="flex-grow-1 flex-shrink-1 flex flex-col">
    <router-view />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "LayRouterView" });
</script>
