<template>
  <el-dialog
    append-to-body
    :title="dialogTitle"
    :visible="dialogVisible"
    width="520px"
    @close="handleCancel"
  >
    <div class="physical-task-dialog">
      <DynamicFormV2 :formItems="formItems" />
    </div>
    <template #footer>
      <div class="physical-task-dialog__footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button :loading="loading" type="primary" @click="handleConfirm">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { DynamicFormItem } from "@/components/Dynamic/schema";
import DynamicFormV2 from "@/components/Dynamic/DynamicFormV2.vue";
import { INIT_ITEM } from "@/components/Dynamic/schema";
import type {
  ShequInfo,
  TaskJob,
  TaskJobCreate,
  TaskJobUpdate
} from "@/api/physicalTask";
import { createPhysicalTask, updatePhysicalTask } from "@/api/physicalTask";

const props = withDefaults(
  defineProps<{
    communityOptions?: ShequInfo[];
  }>(),
  {
    communityOptions: () => []
  }
);

const dialogVisible = ref(false);
const loading = ref(false);
const formItems = ref(new Map<string, DynamicFormItem>());
const currentTask = ref<TaskJob | null>(null);
const dialogTitle = ref("创建体检任务");

let resolveHandler: ((value: TaskJob) => void) | null = null;
let rejectHandler: (() => void) | null = null;

type PhysicalTaskDialogContext = {
  fixedCommunityId?: number;
  fixedCommunityName?: string;
};

let currentContext: PhysicalTaskDialogContext | null = null;

const statusMap = new Map<number, string>([
  [0, "草稿"],
  [10, "进行中"],
  [20, "已完成"]
]);

const safeCommunityOptions = computed(() =>
  Array.isArray(props.communityOptions) ? props.communityOptions : []
);

const communityChildMap = computed(() => {
  const map = new Map();
  safeCommunityOptions.value.forEach(option => {
    const label =
      option.name ?? option.shequ_name ?? `社区 ${option.id ?? "?"}`;
    const key = option.id ?? option.active_app ?? label;
    map.set(key, {
      label,
      value: option.id ?? label
    });
  });
  return map;
});

const buildFormItems = (task?: TaskJob) => {
  const map = new Map<string, DynamicFormItem>();
  map.set(
    "title",
    INIT_ITEM({
      prop: "title",
      value: task?.title ?? "",
      component: "el-input",
      attrs: {
        placeholder: "请输入任务标题"
      },
      attrsFormItem: {
        label: "任务标题",
        rules: [{ required: true, message: "请填写任务标题", trigger: "blur" }]
      }
    })
  );
  map.set(
    "jyh_shequ_id",
    INIT_ITEM({
      prop: "jyh_shequ_id",
      value: task?.jyh_shequ_id ?? currentContext?.fixedCommunityId ?? "",
      component: "el-select",
      childComponent: "el-option",
      childMap: communityChildMap.value,
      attrs: {
        placeholder: "请选择社区"
      },
      attrsFormItem: {
        label: "所属社区",
        rules: [{ required: true, message: "请选择社区", trigger: "change" }]
      }
    })
  );
  map.set(
    "status",
    INIT_ITEM({
      prop: "status",
      value: task?.status ?? 0,
      component: "el-select",
      childComponent: "el-option",
      childMap: new Map(
        Array.from(statusMap.entries()).map(([value, label]) => [
          value,
          { label, value }
        ])
      ),
      attrs: {
        placeholder: "请选择状态"
      },
      attrsFormItem: {
        label: "状态",
        rules: [{ required: true, message: "请选择状态", trigger: "change" }]
      }
    })
  );
  formItems.value = map;
};

const collectFormValues = (): TaskJobCreate => {
  const data: Partial<TaskJobCreate> = {};
  formItems.value.forEach((item, key) => {
    const prop = item.prop || key;
    (data as Record<string, any>)[prop] = item.value;
  });
  return data as TaskJobCreate;
};

const resetPromise = () => {
  resolveHandler = null;
  rejectHandler = null;
};

const handleCancel = () => {
  dialogVisible.value = false;
  rejectHandler?.();
  resetPromise();
};

const handleConfirm = async () => {
  if (loading.value) return;
  const values = collectFormValues();
  if (!values.title) {
    ElMessage.warning("任务标题为必填项");
    return;
  }
  loading.value = true;
  try {
    const payload = currentTask.value
      ? ({
          ...currentTask.value,
          ...values
        } as TaskJobUpdate)
      : values;
    const result = currentTask.value
      ? await updatePhysicalTask(payload as TaskJobUpdate)
      : await createPhysicalTask(payload as TaskJobCreate);
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    resolveHandler?.(result);
  } catch (error) {
    ElMessage.error("保存失败");
    throw error;
  } finally {
    loading.value = false;
    resetPromise();
  }
};

const open = (options?: {
  task?: TaskJob;
  context?: PhysicalTaskDialogContext;
}) => {
  currentTask.value = options?.task ?? null;
  currentContext = options?.context ?? null;
  dialogTitle.value = currentTask.value ? "编辑体检任务" : "创建体检任务";
  buildFormItems(currentTask.value ?? undefined);
  dialogVisible.value = true;
  return new Promise<TaskJob>((resolve, reject) => {
    resolveHandler = resolve;
    rejectHandler = reject;
  });
};

watch(
  communityChildMap,
  () => {
    if (dialogVisible.value) {
      buildFormItems(currentTask.value ?? undefined);
    }
  },
  { immediate: false }
);

defineExpose({ open });
defineOptions({ name: "PhysicalTaskDialog" });
</script>

<style scoped lang="scss">
.physical-task-dialog {
  min-width: 480px;
}

.physical-task-dialog__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
