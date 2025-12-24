<template>
  <el-config-provider>
    <lay-panel class="physical-task-function-config-list">
      <template #header>
        <span>功能配置列表</span>
      </template>
      <div class="physical-task-function-config-list__empty">
        <p>暂无配置项，在这里展示功能模块与节点。</p>
      </div>
    </lay-panel>
  </el-config-provider>
</template>

<script setup lang="ts">
defineOptions({ name: "PhysicalTaskFunctionConfigList" });
</script>

<style scoped lang="scss">
.physical-task-function-config-list {
  min-height: 320px;
}

.physical-task-function-config-list__empty {
  margin-top: 32px;
  text-align: center;
  color: var(--el-color-text-regular);
}
</style>

