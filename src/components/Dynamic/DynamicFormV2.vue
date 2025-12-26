<script lang="tsx">
import { computed, defineComponent, h, ref } from "vue";
import type { DynamicFormItem } from "./schema";
import { readOnlyFormatter } from "./schema";
import { checkDynamicPermission } from "./permission";

export default defineComponent({
  name: "DynamicFormV2",
  props: {
    formItems: {
      type: Map,
      default: () => new Map()
    },
    isExpand: {
      type: Boolean,
      default: false
    },
    collapseButtonText: {
      type: String,
      default: "收起"
    },
    expandButtonText: {
      type: String,
      default: "展开"
    }
  },
  emits: ["update:formItems"],
  setup(props, { attrs, emit, slots }) {
    const formCollapsed = ref(false);
    const formRef = ref();
    const formItemsEntries = computed<[string, DynamicFormItem][]>(
      () => Array.from(props.formItems.entries()) as [string, DynamicFormItem][]
    );
    const formItemsValues = computed<DynamicFormItem[]>(
      () => Array.from(props.formItems.values()) as DynamicFormItem[]
    );

    const visibleFormItemCount = computed(() => {
      return formItemsValues.value.filter((item: any) => {
        if (typeof item.visible === "function") {
          return item.visible(item);
        }
        return item.visible;
      }).length;
    });

    const formData = computed({
      get() {
        const formDataMap = new Map();
        const entries = formItemsEntries.value;
        for (let i = 0; i < entries.length; i++) {
          if (props.isExpand && formCollapsed.value && i >= 2) {
            break;
          }
          const [key, item] = entries[i];
          const prop = item?.prop || key;
          item.prop = prop;
          item.key = item?.key || prop;
          formDataMap.set(item.key, item);
        }
        return formDataMap;
      },
      set(val: Map<any, any>) {
        emit("update:formItems", val);
      }
    });

    const checkPermission = (permission?: string | string[]) =>
      checkDynamicPermission(permission ?? null, "perms");

    const renderLabelHint = (item: any) => (
      <el-popover
        placement="top-start"
        title=""
        trigger="hover"
        width="400"
        v-slots={{
          reference: () => (
            <span>
              <span>{item.attrsFormItem.label}</span>
              <i class="el-icon-question c-black_40" />
            </span>
          )
        }}
      >
        <div innerHTML={item.attrsFormItem.labelHint} />
      </el-popover>
    );

    const extractChildren = (mapSource: Map<any, any>) =>
      Array.from(mapSource.entries());

    const renderChildren = (
      childComponent: any,
      childMap: any,
      childSlotMap: Map<any, any>
    ) => {
      const slotPairs = Array.from(childSlotMap || new Map()).map(
        ([key, value]) => {
          if (typeof value === "function") {
            return [key, (...args: any[]) => value(h, ...args)];
          }
          return [key, null];
        }
      );

      const children = extractChildren(childMap).map(([key, value]) => {
        const slotFns = slotPairs.reduce(
          (acc, [slotName, slotRender]) => {
            if (slotRender) {
              acc[slotName] = () => slotRender(value);
            }
            return acc;
          },
          {} as Record<string, () => any>
        );

        return (
          <childComponent
            key={key}
            {...value}
            {...(value?.ref ? { ref: value.ref } : {})}
            v-slots={slotFns}
          />
        );
      });
      return children;
    };

    const renderFormItem = (item: any, scopedSlots: Record<string, any>) => {
      let component = null;
      const slotPairs = Array.from(item.slotMap || new Map()).map(
        ([key, value]: any) => {
          if (typeof value === "function") {
            return [key, (...args: any[]) => value(h, ...args)];
          }
          if (typeof value === "string" && scopedSlots?.[value]) {
            return [key, (...args: any[]) => scopedSlots[value](...args)];
          }
          return [key, null];
        }
      );

      const hasChildMap =
        item.childMap instanceof Map
          ? item.childMap.size
          : item.childMap
            ? Object.keys(item.childMap).length
            : 0;

      if (item.readOnlyFormatter) {
        component = (
          <div
            class="c-black_40 whs-pw"
            innerHTML={item.readOnlyFormatter(item)}
          ></div>
        );
      } else if (item.readOnlyComponent) {
        component = <item.readOnlyComponent />;
      } else if (item.component) {
        const listeners = Object.entries(item.listeners || {}).reduce(
          (acc, [key, value]) => {
            if (/^formItem_/.test(key) && typeof value === "function") {
              const eventName = key.replace(/^formItem_/, "");
              acc[eventName] = (...args: any[]) => value({ args, item });
            }
            return acc;
          },
          { ...(item?.listeners || {}) }
        );

        const attrsMap = Object.entries(item.attrs || {}).reduce(
          (acc, [key, value]) => {
            acc[key] = typeof value === "function" ? value(item) : value;
            return acc;
          },
          {} as Record<string, any>
        );

        component = (
          <div>
            <div class="d-if ai-c w-100p">
              <item.component
                key={item.key}
                {...attrsMap}
                {...(attrsMap.ref ? { ref: attrsMap.ref } : {})}
                vModel={item.value}
                on={listeners}
                v-slots={slotPairs.reduce(
                  (acc, [slotName, slotRender]) => {
                    if (slotRender) {
                      acc[slotName] = () => slotRender(item);
                    }
                    return acc;
                  },
                  {} as Record<string, () => any>
                )}
              >
                {item.content && !hasChildMap ? item.content : null}
                {hasChildMap
                  ? renderChildren(
                      item.childComponent,
                      item.childMap,
                      item.childSlotMap
                    )
                  : null}
              </item.component>
              {item.unit && <span class="ml_1 fxg-0 fxsh-0">{item.unit}</span>}
            </div>
            {item.remark && (
              <div class="c-black_40 fz-14 lh-20" innerHTML={item.remark}></div>
            )}
          </div>
        );
      }

      const attrsFormItemSlotPairs = Array.from(
        item.attrsFormItemSlotMap || new Map()
      ).map(([key, value]: any) => [
        key,
        typeof value === "function"
          ? (...args: any[]) => value(h, ...args)
          : null
      ]);

      const attrsFormItem = Object.entries(item.attrsFormItem || {}).reduce(
        (acc, [key, value]) => {
          acc[key] = typeof value === "function" ? value(item) : value;
          return acc;
        },
        {} as Record<string, any>
      );

      const formItemSlots = attrsFormItemSlotPairs.reduce(
        (acc, [slotName, slotRender]) => {
          if (slotRender) {
            acc[slotName] = () => slotRender(item);
          }
          return acc;
        },
        {} as Record<string, () => any>
      );
      if (item.attrsFormItem.labelHint) {
        formItemSlots.label = () => renderLabelHint(item);
      }
      return (
        <el-col {...item.attrsCol}>
          {item.useFormItem ? (
            <el-form-item
              key={item.key || item.prop}
              prop={`${item.prop}.value`}
              rules={
                item.readOnlyFormatter ||
                item.readOnlyComponent ||
                item.disabled
                  ? []
                  : attrsFormItem.rules
              }
              {...attrsFormItem}
              v-slots={formItemSlots}
            >
              {component}
            </el-form-item>
          ) : (
            component
          )}
        </el-col>
      );
    };

    const render = () => {
      const buttonText = formCollapsed.value
        ? props.expandButtonText
        : props.collapseButtonText;
      const slotButtonBarRight = slots.buttonBarRight ? (
        <div class="button-bar_right fxg-1 jc-fe fxsh-0 d-f pl-10 pr-10 ai-fs">
          {slots.buttonBarRight()}
          {visibleFormItemCount.value > 2 && props.isExpand && (
            <el-button
              type="text"
              onClick={() => {
                formCollapsed.value = !formCollapsed.value;
              }}
            >
              <span>{buttonText}</span>
              <i
                class={`el-icon--right ${formCollapsed.value ? "el-icon-arrow-down" : "el-icon-arrow-up"}`}
              />
            </el-button>
          )}
        </div>
      ) : null;
      const formModel = Object.fromEntries(formData.value);
      return (
        <el-form
          ref={formRef}
          {...attrs}
          model={formModel}
          onSubmit={(event: Event) => event.preventDefault()}
        >
          <div>
            <el-row class="d-f fxw-w" gutter={20}>
              {Array.from(formData.value.values()).map((formItem: any) => {
                const visible =
                  typeof formItem.visible === "function"
                    ? formItem.visible(formItem)
                    : formItem.visible;
                const permission = formItem.permission
                  ? checkPermission(formItem.permission)
                  : true;
                if (!visible || !permission) return null;
                return renderFormItem(formItem, slots);
              })}
              {slotButtonBarRight}
            </el-row>
          </div>
          {slots.buttonBar && slots.buttonBar()}
        </el-form>
      );
    };

    return render;
  }
});
</script>
<style scoped>
.c-black_40 {
  color: rgb(0 0 0 / 40%);
}

.whs-pw {
  white-space: pre-wrap;
}

.d-if {
  display: inline-flex;
}

.ai-c {
  align-items: center;
}

.w-100p {
  width: 100%;
}

.ml_1 {
  margin-left: 1rem;
}

.fxg-0 {
  flex-grow: 0;
}

.fxsh-0 {
  flex-shrink: 0;
}

.fz-14 {
  font-size: 14px;
}

.lh-20 {
  line-height: 20px;
}

.d-f {
  display: flex;
}

.fxw-w {
  flex-wrap: wrap;
}

/* .button-bar_right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
} */
.jc-fe {
  justify-content: flex-end;
}

.pl-10 {
  padding-left: 10px;
}

.pr-10 {
  padding-right: 10px;
}
</style>
