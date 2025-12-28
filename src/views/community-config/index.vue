<template>
  <div class="flex-grow-1 flex-shrink-1 flex flex-col">
    <el-config-provider>
      <PureTableBar
        :columns="tableColumns"
        tableKey="community-config-table"
        title="社区配置"
        @refresh="loadCommunities"
      >
        <template #buttons>
          <el-button type="primary" @click="handleAddCommunity">
            新建社区
          </el-button>
        </template>
        <template #default="{ size, dynamicColumns }">
          <div class="absolute top-4 left-4 right-4 bottom-4">
            <DynamicTable
              :data="tableData"
              height="100%"
              :loading="isLoading"
              :size="size"
              :tableColumnMap="buildTableColumnMap(dynamicColumns)"
            >
              <template #actions="{ row }">
                <el-button
                  size="small"
                  type="text"
                  @click="handleConfigure(row)"
                >
                  配置
                </el-button>
              </template>
            </DynamicTable>
          </div>
        </template>
      </PureTableBar>
    </el-config-provider>

    <CommunityAddDialog ref="communityAddDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DynamicTable from "@/components/Dynamic/DynamicTable.vue";
import { INIT_COLUMN } from "@/components/Dynamic/table";
import { PureTableBar } from "@/components/RePureTableBar";
import type { CommunityShequ } from "@/api/community";
import { getCommunityShequList } from "@/api/community";
import CommunityAddDialog from "./CommunityAddDialog.vue";

const router = useRouter();
const communityAddDialogRef = ref();

type TableColumnListItem = Record<string, any> & {
  columnKey?: string;
  prop?: string;
  label?: string;
};
const tableColumns: TableColumnListItem[] = [
  {
    columnKey: "index",
    ...INIT_COLUMN({
      prop: "index",
      label: "序号",
      width: 80,
      formatter: (_row: CommunityShequ, _column: any, value: number) =>
        value || "-"
    })
  },
  {
    columnKey: "community",
    ...INIT_COLUMN({
      prop: "name",
      label: "社区",
      minWidth: 220,
      formatter: (row: CommunityShequ) =>
        row.name ?? row.shequ_name ?? `社区 ${row.id}`
    })
  },
  {
    columnKey: "key",
    ...INIT_COLUMN({
      prop: "key",
      label: "英文标识",
      minWidth: 160
    })
  },
  {
    columnKey: "type",
    ...INIT_COLUMN({
      prop: "type",
      label: "类型",
      minWidth: 120,
      formatter: (row: CommunityShequ) => row.type ?? "未设置"
    })
  },
  {
    columnKey: "level",
    ...INIT_COLUMN({
      prop: "level",
      label: "级别",
      width: 120,
      formatter: (row: CommunityShequ) => row.level ?? "未设置"
    })
  },
  {
    columnKey: "parent",
    ...INIT_COLUMN({
      prop: "parent_id",
      label: "父级",
      width: 120,
      formatter: (row: CommunityShequ) =>
        row.parent_id === null || row.parent_id === undefined
          ? "无"
          : String(row.parent_id)
    })
  },
  {
    columnKey: "sort",
    ...INIT_COLUMN({
      prop: "sort",
      label: "排序",
      width: 90,
      formatter: (row: CommunityShequ) =>
        row.sort === null || row.sort === undefined ? "-" : row.sort
    })
  },
  {
    columnKey: "actions",
    ...INIT_COLUMN({
      prop: "actions",
      label: "操作",
      width: 80,
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

const communities = ref<CommunityShequ[]>([]);
const isLoading = ref(false);
const tableData = computed(() =>
  communities.value.map((item, index) => ({
    ...item,
    index: index + 1
  }))
);

const loadCommunities = async () => {
  isLoading.value = true;
  try {
    const result = await getCommunityShequList();
    const list = Array.isArray(result?.data) ? result.data : [];
    communities.value = list;
  } catch (_error) {
    communities.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleConfigure = (row: CommunityShequ) => {
  router.push({
    name: "CommunityConfigPhysicalTask",
    params: { jyh_shequ_id: row.id },
    query: {
      shequ_key: row.key ?? "",
      shequName: row.name ?? row.shequ_name ?? row.key ?? ""
    }
  });
};

const handleAddCommunity = async () => {
  console.log("handleAddCommunity called");
  console.log("communityAddDialogRef.value:", communityAddDialogRef.value);
  try {
    await communityAddDialogRef.value?.open();
    await loadCommunities();
  } catch (error) {
    console.log("handleAddCommunity error:", error);
    // 弹窗取消或失败，无需额外处理
  }
};

onMounted(async () => {
  await loadCommunities();
});

defineOptions({ name: "CommunityConfigIndex" });
</script>

<style scoped lang="scss">
.community-config-index__table {
  width: 100%;
}
</style>
