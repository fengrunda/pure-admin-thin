<script lang="tsx">
import { defineComponent } from "vue";
import { checkDynamicPermission } from "./permission";

export default defineComponent({
  name: "DynamicTableColumn",
  props: {
    item: {
      type: Object,
      default: () => ({})
    },
    rootScopedSlots: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const renderColumn = (item: Record<string, any>) => {
      if (!item) return null;

      const scopedSlots: Record<string, any> = {
        ...(props.rootScopedSlots?.[item?.slotHeader] && {
          header: ({ column, $index }: Record<string, any>) =>
            props.rootScopedSlots[item.slotHeader]({ column, $index })
        }),
        ...(props.rootScopedSlots?.[item?.slotContent] && {
          default: ({ row, column, $index }: Record<string, any>) =>
            props.rootScopedSlots[item.slotContent]({
              row,
              column,
              cellValue: row[item.prop],
              $index
            })
        })
      };

      const inputAttrs = { ...item };
      const hasChildMap = Boolean(
        item.childMap instanceof Map && item.childMap.size > 0
      );

      if (
        !item.visible ||
        (item.checkAuth
          ? !checkDynamicPermission(item.checkAuth, "auth")
          : false)
      ) {
        return null;
      }

      const childEntries = (mapSource: Map<any, any>) =>
        Array.from(mapSource.values());

      if (hasChildMap) {
        return (
          <el-table-column {...inputAttrs} key={item.prop}>
            {childEntries(item.childMap).map(child => renderColumn(child))}
          </el-table-column>
        );
      }

      return <el-table-column {...inputAttrs} v-slots={scopedSlots} />;
    };

    return () => renderColumn(props.item);
  }
});
</script>
