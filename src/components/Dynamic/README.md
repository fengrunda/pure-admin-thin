# Dynamic 组件使用说明（Vue3 + Element Plus + pure-admin）

> 目录：`src/components/Dynamic/`  
> 特点：**Map-only**（只支持 `Map` 作为配置数据结构），权限与 pure-admin 统一入口。

## 组件概览

- **`DynamicFormV2.vue`**：基于 `formItems: Map` 的动态表单渲染（支持折叠/展开、表单项 slot、子选项渲染等）。
- **`DynamicTable.vue`**：基于 `tableColumnMap: Map` 的动态表格列渲染。
- **`DynamicTableColumn.vue`**：`DynamicTable` 的递归列组件（支持嵌套列）。
- **`FormTableField.vue`**：表单 + 动态表格的“表单数组编辑器”（常用于“多行表单项”）。

## 重要约束（必读）

- **只支持 Map**
  - `DynamicFormV2.formItems`：`Map<string, DynamicFormItem>`
  - `DynamicTable.tableColumnMap`：`Map<any, ColumnConfig>`
  - `FormTableField.tableColumnMap/formItemMap/tableSlotMap`：均为 `Map`
- **权限字段约定**
  - 表单项权限：`formItem.permission`（走 `permissions`，即 `hasPerms`）
  - 表格列权限：`column.checkAuth`（走路由 `meta.auths`，即 `hasAuth`）

## 工具与类型入口

- **表单 schema**：`schema.ts`
  - `INIT_ITEM(defaultConfig)`：创建表单项配置（含默认值）
  - `readOnlyFormatter(item)`：只读显示格式化
  - `quictGenerateChild(...)` / `convertV1ToV2(...)`：辅助生成选项子项（如 select/radio/checkbox）
- **表格列 schema**：`table.ts`
  - `INIT_COLUMN(defaultConfig)`：创建表格列配置（含默认值）
- **权限入口**：`permission.ts`
  - `checkDynamicPermission(value, mode)`：统一权限判断（内部组合 `hasPerms/hasAuth`）

## 最小用法：DynamicTable

1. 生成列配置（**Map**）

```ts
const tableColumnMap = new Map();
tableColumnMap.set("name", INIT_COLUMN({ prop: "name", label: "名称" }));
```

2. 使用组件（模板示意）

```ts
// <DynamicTable :tableColumnMap="tableColumnMap" :data="list" />
```

## 最小用法：DynamicFormV2

1. 生成表单项（**Map**）

```ts
const formItems = new Map();
formItems.set(
  "name",
  INIT_ITEM({ prop: "name", attrsFormItem: { label: "名称" } })
);
```

2. 使用组件（模板示意）

```ts
// <DynamicFormV2 :formItems="formItems" />
```

## 最小用法：FormTableField（多行表单）

1. 准备 3 份 Map（列/单元格表单项/表格 slot）

```ts
const tableColumnMap = new Map();
const formItemMap = new Map();
```

2. 使用组件（模板示意）

```ts
// <FormTableField v-model="rows" :tableColumnMap="tableColumnMap" :formItemMap="formItemMap" />
```

## 权限说明（pure-admin）

- **表单项**：`permission` 字段存在时会校验；不通过则该项不渲染。
- **表格列**：`checkAuth` 字段存在时会校验；不通过则该列不渲染。

> 如果你希望全站只用一种权限模式（比如只用 `permissions`），可以只改 `permission.ts` 的策略，不需要动业务配置。

## PhysicalTaskDialog 弹窗（快速复用）

- 位置：`src/views/physical-task/PhysicalTaskDialog.vue`，内部通过 `DynamicFormV2` 构建表单，所有项由 `Map` 配置。
- 入口：`defineExpose({ open })` 暴露 `open` 方法，支持接收 `{ task?: TaskJob }`（编辑）并返回一个 `Promise<TaskJob>`，成功后可刷新列表。
- 参数：通过 `:community-options="shequList"` 注入社区数据，表单项使用 `INIT_ITEM` + `childMap` 来映射 Select 选项，状态字段使用 `Map<value,label>` 约定。
- 示例：

```ts
const dialogRef = ref<InstanceType<typeof PhysicalTaskDialog>>(null);
await dialogRef.value?.open({ task: currentRow });
```

## 常见问题

- **Q: 为什么强制 Map？**
  - A: Map 对“有序配置 + 复杂 value（函数/slot）”更稳定，且减少 Object/Map 双分支逻辑，组件内部更简单。

- **Q: slot 怎么传？**
  - A: 目前组件内部用 `v-slots` 统一处理；外部若要自定义渲染，请按组件约定将 slot 渲染函数放进 `slotMap/tableSlotMap/childSlotMap`（均为 Map）。
