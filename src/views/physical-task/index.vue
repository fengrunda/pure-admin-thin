<template>
  <div class="physical-task-page">
    <el-config-provider>
      <div class="physical-task-page__title">体检任务</div>
      <p>在此展示体检任务相关内容。</p>
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "PhysicalTask" });
</script>

<style scoped lang="scss">
.physical-task-page {
  padding: 32px;
}

.physical-task-page__title {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}
</style>
