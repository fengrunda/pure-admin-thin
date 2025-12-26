import type { VNodeChild } from "vue";

export type DynamicSlotRenderer = (...args: any[]) => VNodeChild;
export type DynamicSlotMap = Map<string, DynamicSlotRenderer | string>;

export type DynamicChildMap<T = any> =
  | Map<any, T>
  | ((scope: any) => Map<any, T>);

export interface DynamicFormItem {
  prop?: string;
  key?: string;
  value?: any;
  defaultValue?: any;
  visible?: boolean | ((item: any) => boolean);
  useFormItem?: boolean;
  remark?: string;
  unit?: string;
  permission?: string | string[] | null;
  readOnlyFormatter?: ((item: any) => string) | null;
  readOnlyComponent?: any;
  component?: any;
  content?: any;
  attrsFormItem?: Record<string, any>;
  attrs?: Record<string, any>;
  attrsCol?: Record<string, any>;
  listeners?: Record<string, any>;
  slotMap?: DynamicSlotMap;
  childComponent?: any;
  childMap?: DynamicChildMap<any>;
  childSlotMap?: Map<string, DynamicSlotRenderer>;
}

const DEFAULT_FORM_ITEM: DynamicFormItem = {
  prop: "",
  value: undefined,
  defaultValue: undefined,
  visible: true,
  readOnlyFormatter: null,
  readOnlyComponent: null,
  useFormItem: true,
  remark: "",
  component: null,
  content: "",
  attrsFormItem: {
    label: "",
    labelHint: "",
    rules: []
  },
  attrs: {
    placeholder: "",
    clearable: true
  },
  listeners: {},
  attrsCol: {
    xs: 24,
    sm: 12,
    md: 8,
    lg: 6,
    xl: 4
  },
  unit: "",
  permission: null,
  slotMap: new Map(),
  childComponent: null,
  childMap: new Map(),
  childSlotMap: new Map()
};

export const INIT_ITEM = (defaultConfig: Partial<DynamicFormItem>) => {
  return {
    ...DEFAULT_FORM_ITEM,
    ...defaultConfig
  } as DynamicFormItem;
};

export const quictGenerateChild = ({
  childComponent,
  optionMap,
  attrsChild,
  optionFormatter
}: Record<string, any>) => {
  const childMap = new Map();
  const childSlotMap = new Map();
  const optionMapEntries: IterableIterator<[any, any]> | [any, any][] =
    optionMap instanceof Map ? optionMap.entries() : Object.entries(optionMap);
  Array.from(optionMapEntries).forEach(([key, text]) => {
    switch (childComponent) {
      case "el-option":
        childMap.set(key, {
          ...attrsChild,
          key,
          label: text,
          value: key,
          disabled: false
        });
        break;
      case "el-radio":
      case "el-checkbox":
        childMap.set(key, {
          ...attrsChild,
          key,
          label: text,
          value: key
        });
        break;
    }
  });
  switch (childComponent) {
    case "el-option":
      optionFormatter &&
        childSlotMap.set("default", (h: any, scope: any) =>
          optionFormatter(h, scope)
        );
      break;
    case "el-radio":
    case "el-checkbox":
      childSlotMap.set("default", (_h: any, scope: any) => scope.label);
      break;
  }
  return { childMap, childSlotMap };
};

export const convertV1ToV2 = (formItemsV1: Record<string, any>) => {
  const newFormItems = INIT_ITEM(formItemsV1);
  newFormItems.component = formItemsV1.componentNameMain;
  newFormItems.childComponent = formItemsV1.componentNameChild;
  ({
    childMap: newFormItems.childMap,
    childSlotMap: newFormItems.childSlotMap
  } = quictGenerateChild({
    childComponent: formItemsV1.componentNameChild,
    optionMap: formItemsV1.optionMap,
    attrsChild: formItemsV1.attrsChild,
    optionFormatter: formItemsV1.optionFormatter
  }));
  return newFormItems;
};

export const readOnlyFormatter = (item: any) => {
  let value = item.value;
  if (item.childMap instanceof Map && item.childMap.size > 0) {
    value = (Array.isArray(value) ? value : [value])
      .map(v => item.childMap.get(v)?.label || v)
      .join("、");
  }
  if (value === "null") return "-";
  if (value === 0) return "0";
  return value || "";
};
