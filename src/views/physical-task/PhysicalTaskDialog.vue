<template>
  <el-dialog
    v-model="dialogVisible"
    append-to-body
    :title="dialogTitle"
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
  TaskJobUpdate,
  CommunityTask,
  CommunityQuestionnaire
} from "@/api/physicalTask";
import { createPhysicalTask, updatePhysicalTask } from "@/api/physicalTask";

const props = withDefaults(
  defineProps<{
    communityOptions?: ShequInfo[];
    communityTasks?: Map<number, CommunityTask>;
    communityQuestionnaires?: Map<number, CommunityQuestionnaire>;
    shequKey?: string;
  }>(),
  {
    communityOptions: () => [],
    communityTasks: () => new Map(),
    communityQuestionnaires: () => new Map(),
    shequKey: ""
  }
);

const dialogVisible = ref(false);
const loading = ref(false);
const formItems = ref(new Map<string, DynamicFormItem>());
const currentTask = ref<TaskJob | null>(null);
const dialogTitle = ref("创建体检任务");
const selectedTask = ref<CommunityTask | null>(null);

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

const taskChildMap = computed(() => {
  const map = new Map();
  props.communityTasks.forEach(task => {
    const label = task.name ?? `任务 ${task.id}`;
    map.set(task.id, {
      label,
      value: task.id
    });
  });
  return map;
});

const questionnaireChildMap = computed(() => {
  const map = new Map();
  // 显示所有可用的问卷（目前阶段，后续可以根据任务关联关系过滤）
  props.communityQuestionnaires.forEach(questionnaire => {
    const label =
      questionnaire.name ?? `问卷 ${questionnaire.questionnaire_id}`;
    map.set(questionnaire.questionnaire_id, {
      label,
      value: questionnaire.questionnaire_id
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
      },
      attrsCol: {
        span: 24
      }
    })
  );
  // 任务选择字段
  map.set(
    "jyh_task_id",
    INIT_ITEM({
      prop: "jyh_task_id",
      value: task?.jyh_task_id ?? "",
      component: "el-select",
      childComponent: "el-option",
      childMap: taskChildMap.value,
      attrs: {
        placeholder: "请选择任务",
        clearable: true
      },
      attrsFormItem: {
        label: "选择任务",
        rules: [{ required: true, message: "请选择任务", trigger: "change" }]
      },
      attrsCol: {
        span: 24
      }
    })
  );

  // 问卷选择字段（根据选中的任务动态更新）
  map.set(
    "jyh_questionnaire_id",
    INIT_ITEM({
      prop: "jyh_questionnaire_id",
      value: task?.jyh_questionnaire_id ?? "",
      component: "el-select",
      childComponent: "el-option",
      childMap: questionnaireChildMap.value,
      attrs: {
        placeholder: "请选择问卷",
        clearable: true
      },
      attrsFormItem: {
        label: "选择问卷",
        rules: [{ required: true, message: "请选择问卷", trigger: "change" }]
      },
      attrsCol: {
        span: 24
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
      },
      attrsCol: {
        span: 24
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

  // 确保社区 ID 被包含
  if (currentContext?.fixedCommunityId && !data.jyh_shequ_id) {
    data.jyh_shequ_id = currentContext.fixedCommunityId;
  }

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
  if (!values.jyh_task_id) {
    ElMessage.warning("请选择任务");
    return;
  }
  if (!values.jyh_questionnaire_id) {
    ElMessage.warning("请选择问卷");
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

  // 检查社区选项是否已加载
  if (!props.communityOptions || props.communityOptions.length === 0) {
    ElMessage.warning("社区数据正在加载中，请稍后再试");
    return Promise.reject(new Error("社区数据未加载"));
  }

  // 检查社区问卷数据是否已加载
  if (
    !props.communityQuestionnaires ||
    props.communityQuestionnaires.size === 0
  ) {
    ElMessage.warning("问卷数据正在加载中，请稍后再试");
    return Promise.reject(new Error("问卷数据未加载"));
  }

  // 初始化选中的任务（如果是编辑模式）
  if (currentTask.value?.jyh_task_id) {
    selectedTask.value =
      props.communityTasks.get(currentTask.value.jyh_task_id) || null;
  } else {
    selectedTask.value = null;
  }

  buildFormItems(currentTask.value ?? undefined);

  // 确保问卷选项已正确设置到表单中
  const questionnaireItem = formItems.value.get("jyh_questionnaire_id");
  if (questionnaireItem) {
    questionnaireItem.childMap = questionnaireChildMap.value;
  }

  dialogVisible.value = true;
  return new Promise<TaskJob>((resolve, reject) => {
    resolveHandler = resolve;
    rejectHandler = reject;
  });
};

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
