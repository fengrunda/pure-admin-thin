<template>
  <el-table
    ref="table"
    v-loading="loading"
    v-bind="$attrs"
    tooltip-effect="dark"
  >
    <DynamicTableColumn
      v-for="[key, item] in columnEntries"
      :key="key"
      :item="item"
      :root-scoped-slots="mergedScopedSlots"
    />
  </el-table>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import DynamicTableColumn from "./DynamicTableColumn.vue";

export default defineComponent({
  name: "DynamicTable",
  components: {
    DynamicTableColumn
  },
  props: {
    tableColumnMap: {
      type: Map,
      default: () => new Map()
    },
    loading: {
      type: Boolean,
      default: false
    },
    scopedSlots: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { slots }) {
    const columnEntries = computed<[PropertyKey, any][]>(
      () => Array.from(props.tableColumnMap.entries()) as [PropertyKey, any][]
    );

    const mergedScopedSlots = computed<Record<string, any>>(() => ({
      ...(slots || {}),
      ...(props.scopedSlots || {})
    }));

    return {
      columnEntries,
      mergedScopedSlots
    };
  }
});
</script>
