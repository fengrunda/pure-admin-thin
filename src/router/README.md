# 路由配置注意事项（pure-admin-thin）

本项目基于 pure-admin 的路由处理流程，会对路由做“拍平/格式化”（见 `src/router/index.ts` 里 `formatFlatteningRoutes/formatTwoStageRoutes` 的使用）。因此在编写静态路由（`src/router/modules/*.ts`）时，需要遵循以下约定，否则会出现菜单/面包屑/tabs 识别异常。

## 必须：子路由使用**绝对 path**

- **原因**：路由会被拍平为二级结构，若子路由使用相对 path（例如 `"list"`），拍平后会丢失父级前缀，最终变成错误的根路径（例如 `"/list"`）。
- **建议**：在 `children` 中也写完整的绝对路径（包含动态段 `:id` 的前缀），确保刷新/跳转/标签页缓存一致。

## keepAlive / 标签页：路由 `name` 与页面 `defineOptions({ name })` 必须一致

- **原因**：缓存与标签页等能力会依赖 `route.name` 作为 key。
- **做法**：路由 `name` 唯一且与页面组件 `defineOptions({ name })` 完全一致。

## 常用 meta 说明

- **`meta.showLink`**
  - `true`（默认）：显示在菜单
  - `false`：不显示在菜单（常用于详情页/中间层级）
- **`meta.activePath`**
  - 通过 `params/query` 进入且 `showLink:false` 的页面，若需要菜单高亮，设置为需要高亮的菜单 `path`
- **`meta.keepAlive`**
  - 开启后会纳入缓存（配合 name 一致性）

## 面包屑：可选插入“动态参数对应名称”（`meta.breadcrumbParam`）

用途：当路由含动态参数（如 `:jyh_shequ_id`）时，可在面包屑中插入一段“名称”，例如展示为：`社区配置 / 测试社区 / 体检任务`。

配置入口：写在**当前页面路由**的 `meta` 中（`CustomizeRouteMeta.breadcrumbParam`）。

字段说明（常用）：

- **`paramKey`**：要读取的 id 参数 key（优先 params，其次 query）
- **`titleKeys`**：按顺序尝试从 query/params 取标题（例如 `["shequName", "shequ_name"]`）
- **`fallback`**：取不到标题时的兜底模板，支持 `{id}`（例如 `"社区 {id}"`）
- **`insertAfterIndex`**：插入到面包屑数组的索引位置（默认 `1`，即插在第 0 与第 1 个之间）
- **`disabled`**：是否禁用点击（默认 `true`）

> 注意：`breadcrumbParam` 只影响面包屑展示，不影响菜单/路由匹配。
