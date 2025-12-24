const Layout = () => import("@/layout/index.vue");
const LayRouterView = () =>
  import("@/layout/components/lay-router-view/index.vue");

export default {
  path: "/physical-task",
  name: "PhysicalTask",
  component: Layout,
  redirect: "/physical-task/index",
  meta: {
    icon: "ep:checked",
    title: "体检任务",
    rank: 1
  },
  children: [
    // 体检任务列表（入口页面，显示在菜单）
    {
      path: "/physical-task/index",
      name: "PhysicalTaskIndex",
      component: () => import("@/views/physical-task/index.vue"),
      meta: {
        title: "体检任务" // 与父级相同，合并为一级菜单
      }
    },
    // 功能配置（中间层级，用于面包屑显示）
    {
      path: "/physical-task/function-config",
      name: "PhysicalTaskFunctionConfig",
      component: LayRouterView,
      redirect: "/physical-task/function-config/list",
      meta: {
        title: "功能配置",
        showLink: false // 不显示在菜单
      },
      children: [
        // 功能配置列表
        {
          path: "/physical-task/function-config/list",
          name: "PhysicalTaskFunctionConfigList",
          component: () =>
            import("@/views/physical-task/function-config/list.vue"),
          meta: {
            title: "功能配置", // 与父级相同，面包屑合并显示
            showLink: false,
            activePath: "/physical-task/index" // 高亮体检任务菜单
          }
        },
        // 配置详情
        {
          path: "/physical-task/function-config/config-page",
          name: "PhysicalTaskFunctionConfigConfigPage",
          component: () =>
            import("@/views/physical-task/function-config/config-page.vue"),
          meta: {
            title: "配置详情",
            showLink: false,
            activePath: "/physical-task/index" // 高亮体检任务菜单
          }
        }
      ]
    }
  ]
} satisfies RouteConfigsTable;
