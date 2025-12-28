<template>
  <div class="flex-grow-1 flex-shrink-1 flex flex-col">
    <el-config-provider>
      <PureTableBar
        class="physical-task-index__bar"
        :columns="tableColumns"
        tableKey="physical-task-table"
        :title="pageTitle"
        @refresh="loadTasks"
      >
        <template #buttons>
          <el-button type="primary" @click="handleCreate">新建任务</el-button>
        </template>
        <template #default="{ size, dynamicColumns }">
          <div class="p-4 flex-grow-1 flex-shrink-1 flex flex-col">
            <DynamicFormV2 :formItems="filterFormItems">
              <template #buttonBarRight>
                <el-button
                  :loading="listLoading"
                  type="primary"
                  @click="handleSearch"
                >
                  查询
                </el-button>
                <el-button @click="handleReset">清空</el-button>
              </template>
            </DynamicFormV2>
            <div class="flex-grow-1 flex-shrink-1 flex flex-col relative">
              <DynamicTable
                :data="listPagination.result"
                height="100%"
                :loading="listLoading"
                :size="size"
                :tableColumnMap="buildTableColumnMap(dynamicColumns)"
              >
                <template #actions="{ row }">
                  <el-button size="small" type="text" @click="handleEdit(row)">
                    编辑
                  </el-button>
                  <el-button
                    class="!text-red-500"
                    size="small"
                    type="text"
                    @click="handleDelete(row)"
                  >
                    删除
                  </el-button>
                </template>
              </DynamicTable>
            </div>
            <div class="flex justify-end mt-4">
              <el-pagination
                background
                :current-page="listPagination.page"
                layout="sizes, prev, pager, next, total"
                :page-size="listPagination.size"
                :page-sizes="[10, 20, 50]"
                :total="listPagination.total"
                @current-change="page => setListPage(page)"
                @size-change="size => setListPageSize(size)"
              />
            </div>
          </div>
        </template>
      </PureTableBar>
      <PhysicalTaskDialog
        ref="dialogRef"
        :community-options="communityList"
        :community-questionnaires="communityQuestionnaires"
        :community-tasks="communityTasks"
        :shequ-key="props.shequ_key"
      />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const props = withDefaults(defineProps<CommunityPhysicalTaskProps>(), {
  jyh_shequ_id: 0,
  shequ_key: "",
  shequ_name: ""
});
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import DynamicTable from "@/components/Dynamic/DynamicTable.vue";
import DynamicFormV2 from "@/components/Dynamic/DynamicFormV2.vue";
import { INIT_ITEM } from "@/components/Dynamic/schema";
import { INIT_COLUMN } from "@/components/Dynamic/table";
import { PureTableBar } from "@/components/RePureTableBar";
import PhysicalTaskDialog from "./PhysicalTaskDialog.vue";
import type { DynamicFormItem } from "@/components/Dynamic/schema";
import type {
  ShequInfo,
  TaskJob,
  CommunityTask,
  CommunityQuestionnaire
} from "@/api/physicalTask";
import { useListQuery } from "@/hooks/useListQuery";
import {
  getPhysicalTaskListByCommunity,
  deletePhysicalTask,
  getShequList,
  getCommunityTaskList
} from "@/api/physicalTask";

interface CommunityPhysicalTaskProps {
  jyh_shequ_id?: number;
  shequ_key?: string;
  shequ_name?: string;
}

const route = useRoute();

const statusLabels = new Map<number, string>([
  [0, "草稿"],
  [10, "进行中"],
  [20, "已完成"]
]);

const filterFormItems = ref(
  new Map<string, DynamicFormItem>([
    [
      "title",
      INIT_ITEM({
        prop: "title",
        component: "el-input",
        value: "",
        attrs: { placeholder: "任务名称/关键词", clearable: true },
        attrsFormItem: { label: "关键词" }
      })
    ],
    [
      "status",
      INIT_ITEM({
        prop: "status",
        component: "el-select",
        childComponent: "el-option",
        childMap: new Map(
          Array.from(statusLabels.entries()).map(([value, label]) => [
            value,
            { label, value }
          ])
        ),
        attrs: { placeholder: "选择状态", clearable: true },
        attrsFormItem: { label: "状态" }
      })
    ]
  ])
);
type TableColumnListItem = Record<string, any> & {
  columnKey?: string;
  prop?: string;
  label?: string;
};
const tableColumns: TableColumnListItem[] = [
  {
    columnKey: "taskId",
    ...INIT_COLUMN({ prop: "task_id", label: "任务 ID", width: 120 })
  },
  {
    columnKey: "title",
    ...INIT_COLUMN({ prop: "title", label: "任务名称", minWidth: 220 })
  },
  {
    columnKey: "status",
    ...INIT_COLUMN({
      prop: "status",
      label: "状态",
      width: 110,
      formatter: (_row: TaskJob, _column: any, value: number) =>
        statusLabels.get(value) ?? "未知"
    })
  },
  {
    columnKey: "created",
    ...INIT_COLUMN({
      prop: "created_at",
      label: "创建时间",
      width: 180
    })
  },
  {
    columnKey: "updated",
    ...INIT_COLUMN({
      prop: "updated_at",
      label: "更新时间",
      width: 180
    })
  },
  {
    columnKey: "actions",
    ...INIT_COLUMN({
      prop: "actions",
      label: "操作",
      width: 140,
      fixed: "right",
      slotContent: "actions"
    })
  }
];
const buildTableColumnMap = (columns: TableColumnListItem[]) => {
  const map = new Map<string, TableColumnListItem>();
  columns.forEach((column, index) => {
    const key =
      column.columnKey ?? column.prop ?? column.label ?? `column-${index}`;
    const visible =
      column.visible !== undefined
        ? column.visible && !column.hide
        : !column.hide;
    map.set(key, {
      ...column,
      visible
    });
  });
  return map;
};

const tasks = ref<TaskJob[]>([]);
const communityList = ref<ShequInfo[]>([]);
const communityTasks = ref<Map<number, CommunityTask>>(new Map());
const communityQuestionnaires = ref<Map<number, CommunityQuestionnaire>>(
  new Map()
);
const dialogRef = ref<InstanceType<typeof PhysicalTaskDialog> | null>(null);
const {
  params: listParams,
  pagination: listPagination,
  loading: listLoading,
  withLoading,
  setParams: setListParams,
  setPage: setListPage,
  setPageSize: setListPageSize,
  setResult: setListResult
} = useListQuery<Record<string, any>, TaskJob>({
  defaultPagination: { page: 1, size: 10 }
});

const currentCommunityId = computed(() => props.jyh_shequ_id || undefined);

const currentCommunityName = computed(() => props.shequ_name || "");

const pageTitle = computed(() => {
  const name = currentCommunityName.value || "未知社区";
  return `社区配置 / ${name} / 体检任务`;
});

const collectFilters = () => {
  const filters: Record<string, any> = {};
  filterFormItems.value.forEach((item, key) => {
    const prop = item.prop || key;
    filters[prop] = item.value;
  });
  return filters;
};

const filteredTasks = computed(() => {
  const { title = "", status } = listParams.value;
  return tasks.value.filter(task => {
    const matchesTitle = title ? task.title?.includes(title) : true;
    const matchesStatus =
      status !== undefined && status !== ""
        ? (task.status ?? 0) === Number(status)
        : true;
    return matchesTitle && matchesStatus;
  });
});

const pagedTasks = computed(() => {
  const start = (listPagination.page - 1) * listPagination.size;
  return filteredTasks.value.slice(start, start + listPagination.size);
});

const loadCommunities = async () => {
  try {
    const list = await getShequList();
    communityList.value = Array.isArray(list) ? list : [];
  } catch (_error) {
    ElMessage.error("社区列表加载失败");
    communityList.value = [];
  }
};

const loadCommunityTasks = async () => {
  const communityId = currentCommunityId.value;
  if (!communityId) {
    communityTasks.value = new Map();
    communityQuestionnaires.value = new Map();
    return;
  }
  try {
    const response = await getCommunityTaskList(communityId);
    const tasksArray = response.data?.tasks || [];
    const questionnairesArray = response.data?.questionnaires || [];

    // 处理任务数据
    const tasksMap = new Map<number, CommunityTask>();
    tasksArray.forEach(task => {
      tasksMap.set(task.id, {
        id: task.id,
        name: task.name
      });
    });
    communityTasks.value = tasksMap;

    // 处理问卷数据
    const questionnairesMap = new Map<number, CommunityQuestionnaire>();
    questionnairesArray.forEach(questionnaire => {
      if (questionnaire.questionnaire_id) {
        questionnairesMap.set(questionnaire.questionnaire_id, {
          questionnaire_id: questionnaire.questionnaire_id,
          name: questionnaire.name
        });
      }
    });
    communityQuestionnaires.value = questionnairesMap;
  } catch (_error) {
    ElMessage.error("社区任务列表加载失败");
    communityTasks.value = new Map();
    communityQuestionnaires.value = new Map();
  }
};

const loadTasks = () =>
  withLoading(async () => {
    const jyhShequId = currentCommunityId.value;
    if (!jyhShequId) {
      tasks.value = [];
      return;
    }
    try {
      const result = await getPhysicalTaskListByCommunity(jyhShequId);
      tasks.value = Array.isArray(result) ? result : [];
    } catch (_error) {
      ElMessage.error("任务列表加载失败");
      tasks.value = [];
    }
  });

const handleSearch = async () => {
  setListParams(collectFilters());
  setListPage(1);
  await loadTasks();
};

const handleReset = async () => {
  filterFormItems.value.forEach(item => {
    item.value = "";
  });
  setListParams(collectFilters());
  setListPage(1);
  await loadTasks();
};

const handleCreate = () => {
  const fixedCommunityId = currentCommunityId.value;
  if (!fixedCommunityId) {
    ElMessage.warning("缺少社区参数，无法创建任务");
    return;
  }
  dialogRef.value
    ?.open({
      context: {
        fixedCommunityId,
        fixedCommunityName: currentCommunityName.value
      }
    })
    .then(() => loadTasks())
    .catch(() => {});
};

const handleEdit = (row: TaskJob) => {
  const fixedCommunityId = row.jyh_shequ_id ?? currentCommunityId.value;
  dialogRef.value
    ?.open({
      task: row,
      context: {
        fixedCommunityId,
        fixedCommunityName: row.jyh_shequ_name ?? currentCommunityName.value
      }
    })
    .then(() => loadTasks())
    .catch(() => {});
};

const handleDelete = async (row: TaskJob) => {
  const key = row.task_id;
  if (!key) return;
  try {
    await ElMessageBox.confirm("确认删除该任务？", "提示", {
      type: "warning"
    });
    await deletePhysicalTask({
      task_id: key,
      title: row.title || ""
    });
    ElMessage.success("删除成功");
    await loadTasks();
  } catch {
    ElMessage.info("已取消删除");
  }
};

setListParams(collectFilters());

onMounted(async () => {
  await loadCommunities();
});

watch(
  currentCommunityId,
  async () => {
    await Promise.all([loadTasks(), loadCommunityTasks()]);
  },
  { immediate: true }
);

watch(
  filteredTasks,
  list => {
    listPagination.total = list.length;
    const maxPage = Math.max(1, Math.ceil(list.length / listPagination.size));
    if (listPagination.page > 1 && listPagination.page > maxPage) {
      setListPage(1);
    }
  },
  { immediate: true }
);

watch(
  pagedTasks,
  page => {
    setListResult(page, filteredTasks.value.length);
  },
  { immediate: true }
);

defineOptions({ name: "CommunityConfigPhysicalTask" });
</script>

<style scoped lang="scss">
.physical-task-index__bar {
  background: var(--el-color-white);
}

.physical-task-index__filter {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 18px;
}

.physical-task-index__filter-buttons {
  display: flex;
  gap: 8px;
}
</style>
