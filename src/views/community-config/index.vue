<template>
  <div class="community-config-index">
    <el-config-provider>
      <PureTableBar
        class="community-config-index__bar"
        :columns="tableColumns"
        tableKey="community-config-table"
        title="社区配置"
        @refresh="loadCommunities"
      >
        <template #buttons>
          <el-button disabled type="primary">新建社区</el-button>
        </template>
        <template #default="{ size, dynamicColumns }">
          <div class="p-4">
            <DynamicTable
              :data="tableData"
              :loading="isLoading"
              :scopedSlots="tableScopedSlots"
              :size="size"
              :tableColumnMap="buildTableColumnMap(dynamicColumns)"
            />
          </div>
        </template>
      </PureTableBar>
    </el-config-provider>
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

const router = useRouter();
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
      width: 120,
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
      shequName: row.name ?? row.shequ_name ?? ""
    }
  });
};

const tableScopedSlots = {
  actions: ({ row }: { row: CommunityShequ }) =>
    h(
      "el-button",
      {
        type: "primary",
        size: "mini",
        onClick: () => handleConfigure(row)
      },
      "配置"
    )
};

onMounted(async () => {
  await loadCommunities();
});

defineOptions({ name: "CommunityConfigIndex" });
</script>

<style scoped lang="scss">
.community-config-index__bar {
  background: var(--el-color-white);
}

.community-config-index__table {
  width: 100%;
}
</style>
