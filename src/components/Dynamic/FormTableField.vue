<script lang="tsx">
import { computed, defineComponent, h, ref } from "vue";
import { INIT_ITEM } from "./schema";
import { INIT_COLUMN } from "./table";
import { checkDynamicPermission } from "./permission";
import DynamicTable from "./DynamicTable.vue";

export { INIT_ITEM, INIT_COLUMN };

type FormValue = Record<string, any>;

export default defineComponent({
  name: "FormTableField",
  props: {
    value: {
      type: Array,
      default: () => []
    },
    showAddBtn: {
      type: Boolean,
      default: true
    },
    btnAddText: {
      type: String,
      default: "添加"
    },
    tableAttrs: {
      type: Object,
      default: () => ({})
    },
    tableColumnMap: {
      type: Map,
      default: () => new Map()
    },
    formItemMap: {
      type: Map,
      default: () => new Map()
    },
    tableSlotMap: {
      type: Map,
      default: () => new Map()
    }
  },
  emits: ["change", "add", "delete"],
  setup(props, { attrs, emit, slots }) {
    const formRef = ref();
    const tableRef = ref();
    const valueComputed = computed({
      get() {
        return props.value;
      },
      set(val) {
        emit("change", val);
      }
    });

    const valueComputedMap = computed(() =>
      valueComputed.value.reduce(
        (acc, item, index) => {
          acc[index] = item;
          return acc;
        },
        {} as Record<number, FormValue>
      )
    );

    const handleAddGroup = () => emit("add");

    const renderLabelHint = (item: FormValue) =>
      item.attrsFormItem.labelHint && (
        <el-popover
          content={item.attrsFormItem.labelHint}
          placement="top-start"
          title=""
          trigger="hover"
          width="400"
          v-slots={{
            reference: () => <i class="el-icon-question c-black_40" />
          }}
        />
      );

    const resolveChildMap = (childMap: any, cellScoped: any) =>
      typeof childMap === "function" ? childMap(cellScoped) : childMap;

    const renderChildren = (
      childComponent: any,
      childMap: any,
      childSlotMap: Map<any, any>,
      cellScoped: any
    ) => {
      const actualChildMap = resolveChildMap(childMap, cellScoped) || [];
      return Array.from(actualChildMap).map(([key, value]: any) => (
        <childComponent
          key={key}
          {...value}
          {...(value?.ref ? { ref: value.ref } : {})}
          v-slots={Array.from(childSlotMap || new Map()).reduce(
            (acc, [slotName, slotRender]) => {
              if (typeof slotRender === "function") {
                acc[slotName] = () => slotRender(h, value, cellScoped);
              }
              return acc;
            },
            {} as Record<string, () => any>
          )}
        />
      ));
    };

    const buildListeners = (
      item: FormValue,
      cellScoped: any,
      inherited: Record<string, any>
    ) =>
      Object.entries({ ...inherited, ...item?.listeners }).reduce(
        (acc, [key, value]) => {
          if (/^cellItem_/.test(key) && typeof value === "function") {
            const eventName = key.replace(/^cellItem_/, "");
            acc[eventName] = (...args: any[]) => {
              value({ args, item, scoped: cellScoped });
            };
          }
          return acc;
        },
        { ...(item?.listeners || {}) }
      );

    const renderFormItem = (
      item: FormValue,
      cellScoped: any,
      inheritedListeners: Record<string, any>
    ) => {
      if (!item) return null;
      let component = null;
      const slotFns = Array.from(item.slotMap || new Map()).reduce(
        (acc, [slotName, slotRender]: any) => {
          if (typeof slotRender === "function") {
            acc[slotName] = () => slotRender(h, item, cellScoped);
          } else if (typeof slotRender === "string" && slots?.[slotRender]) {
            acc[slotName] = () => slots[slotRender]?.(item, cellScoped);
          }
          return acc;
        },
        {} as Record<string, () => any>
      );

      const actualChildMap = resolveChildMap(item.childMap, cellScoped);
      const hasChildMap =
        actualChildMap instanceof Map
          ? actualChildMap.size > 0
          : actualChildMap
            ? Object.keys(actualChildMap).length > 0
            : false;

      if (
        item.permission &&
        !checkDynamicPermission(item.permission, "perms")
      ) {
        return null;
      }
      const listeners = buildListeners(item, cellScoped, inheritedListeners);
      const attrs = Object.entries(item.attrs || {}).reduce(
        (acc, [key, value]) => {
          acc[key] =
            typeof value === "function" ? value(item, cellScoped) : value;
          return acc;
        },
        {} as Record<string, any>
      );

      const attrsFormItem = Object.entries(item.attrsFormItem || {}).reduce(
        (acc, [key, value]) => {
          acc[key] =
            typeof value === "function" ? value(item, cellScoped) : value;
          return acc;
        },
        {} as Record<string, any>
      );

      if (item.readOnlyFormatter) {
        component = (
          <div
            class="c-black_40 whs-pw"
            domPropsInnerHTML={item.readOnlyFormatter(item)}
          ></div>
        );
      } else if (item.readOnlyComponent) {
        component = <item.readOnlyComponent />;
      } else if (item.component) {
        component = (
          <div>
            <div class="d-if ai-c w-100p">
              {
                <item.component
                  key={`${item.prop}_${cellScoped.$index}`}
                  {...attrs}
                  vModel={valueComputed.value[cellScoped.$index][item.prop]}
                  on={listeners}
                  v-slots={slotFns}
                >
                  {item.content && !hasChildMap && item.content}
                  {hasChildMap &&
                    renderChildren(
                      item.childComponent,
                      item.childMap,
                      item.childSlotMap,
                      cellScoped
                    )}
                </item.component>
              }
              {item.unit && <span class="ml_1 fxg-0 fxsh-0">{item.unit}</span>}
            </div>
            {item.remark && (
              <div class="c-black_40 fz-14 lh-20">{item.remark}</div>
            )}
          </div>
        );
      }

      const rules = (attrsFormItem?.rules || []).map(ruleItem => ({
        ...ruleItem,
        ...(typeof ruleItem?.validator === "function"
          ? {
              validator: (rule, value, callback) => {
                ruleItem.validator(rule, value, callback, cellScoped, item);
              }
            }
          : {})
      }));

      return (
        <el-col {...{ attrs: item.attrsCol }}>
          {item.useFormItem && !item?.content ? (
            <el-form-item
              {...{ attrs: attrsFormItem }}
              prop={`[${cellScoped.$index}].${item.prop}`}
              key={`${item.prop}_${cellScoped.$index}`}
              rules={
                item.readOnlyFormatter ||
                item.readOnlyComponent ||
                item.disabled
                  ? []
                  : attrsFormItem.rules
              }
            >
              {renderLabelHint(item)}
              {component}
            </el-form-item>
          ) : (
            component
          )}
        </el-col>
      );
    };

    const render = () => {
      const btnAdd = props.showAddBtn && (
        <el-button type="primary" size="mini" onClick={handleAddGroup}>
          {props.btnAddText}
        </el-button>
      );

      const processColumn = (column: any, acc: Record<string, any>) => {
        if (column.slotContent) {
          acc[column.slotContent] = ({
            row,
            column,
            cellValue,
            $index
          }: any) => {
            const formItem = props.formItemMap[column?.property]
              ? { ...props.formItemMap[column.property] }
              : {};
            const cellScoped = {
              row,
              column,
              cellValue,
              $index
            };
            formItem.listeners = Object.entries(
              formItem.listeners || {}
            ).reduce((acc, [key, value]) => {
              if (typeof value !== "function") return acc;
              acc[key] = (...args) => {
                value(...args, cellScoped);
              };
              return acc;
            }, {});
            return renderFormItem(
              formItem,
              cellScoped,
              attrs as Record<string, any>
            );
          };
        }
        if (column.childMap) {
          Object.values(column.childMap).forEach(childColumn => {
            processColumn(childColumn, acc);
          });
        }
      };

      const generatedTableSlotMap = Array.from(
        props.tableColumnMap.entries()
      ).reduce(
        (acc, [key, column]) => {
          processColumn(column, acc);
          return acc;
        },
        {} as Record<string, any>
      );

      const tableSlotMapInstance = props.tableSlotMap;
      const defaultTableSlotAction = ({ row, $index }: any) => (
        <div>
          <el-button
            type="text"
            onClick={() => {
              emit("delete", row, $index);
            }}
          >
            删除
          </el-button>
        </div>
      );

      const finalTableSlotMap = {
        ...generatedTableSlotMap,
        ...Object.fromEntries(tableSlotMapInstance)
      };

      if (!tableSlotMapInstance.has("action") && !slots.tableSlotAction) {
        finalTableSlotMap.action = defaultTableSlotAction;
      }

      return (
        <el-form
          style={{ width: "100%" }}
          ref={formRef}
          {...{ attrs }}
          props={{ model: valueComputedMap.value }}
          nativeOn={{
            submit: event => {
              event.preventDefault();
            }
          }}
          scopedSlots={slots}
        >
          <DynamicTable
            ref={tableRef}
            {...{ attrs: props.tableAttrs }}
            tableColumnMap={props.tableColumnMap}
            data={valueComputed.value}
            scopedSlots={finalTableSlotMap}
          />
          <div class="d-f jc-fe mt-10">{btnAdd}</div>
        </el-form>
      );
    };

    return render;
  }
});
</script>
