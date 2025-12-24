<template>
  <el-config-provider>
    <lay-panel class="physical-task-function-config-page">
      <template #header>
        <span>配置详情</span>
      </template>
      <div class="physical-task-function-config-page__empty">
        <p>请选择左侧列表项查看配置详情。</p>
      </div>
    </lay-panel>
  </el-config-provider>
</template>

<script setup lang="ts">
defineOptions({ name: "PhysicalTaskFunctionConfigConfigPage" });
</script>

<style scoped lang="scss">
.physical-task-function-config-page {
  min-height: 320px;
}

.physical-task-function-config-page__empty {
  margin-top: 32px;
  text-align: center;
  color: var(--el-color-text-regular);
}
</style>

